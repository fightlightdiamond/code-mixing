import { queryOptions, useQuery, useMutation, useQueryClient, type SelectFn } from "@tanstack/react-query";
import { api } from "./api";
import { queryProfiles, QueryProfileName } from "./queryConfig";
import { keyFactory } from "./keyFactory";
import { entities, EntityName } from "./entityRegistry";

type ListParams = Record<string, string | number | boolean | undefined>;

function buildUrl(baseUrl: string, params?: ListParams) {
  if (!params) return baseUrl;
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && qs.append(k, String(v)));
  return `${baseUrl}?${qs.toString()}`;
}


export function makeResource<
  N extends EntityName,
  TSelectList = unknown,
  TSelectDetail = unknown
>(name: N) {

  const def = entities[name];

  function useList<T = TSelectList>(params?: ListParams, profile: QueryProfileName = "list") {
    const prof = queryProfiles[profile];
    const url = buildUrl(def.baseUrl, params);


    const hasSelectList = (d: typeof def): d is typeof def & { selectList: SelectFn<T> } =>
      "selectList" in d && typeof d.selectList === "function";

    const opts = queryOptions({
      queryKey: keyFactory.list(def.entity, params),
      queryFn: () => api<T>(url),
      ...prof,
      placeholderData: (prev) => prev,
      ...(hasSelectList(def) ? { select: def.selectList as SelectFn<T> } : {}),
    });
    return useQuery(opts);
  }

  function useDetail<T = TSelectDetail>(id: string | number, profile: QueryProfileName = "detail") {
    const prof = queryProfiles[profile];
    const url = `${def.baseUrl}/${id}`;


    const hasSelectDetail = (d: typeof def): d is typeof def & { selectDetail: SelectFn<T> } =>
      "selectDetail" in d && typeof d.selectDetail === "function";

    const opts = queryOptions({
      queryKey: keyFactory.detail(def.entity, id),
      queryFn: () => api<T>(url),
      enabled: !!id,
      ...prof,
      ...(hasSelectDetail(def) ? { select: def.selectDetail as SelectFn<T> } : {}),
    });
    return useQuery(opts);
  }

  function useCreate<TBody extends object, TResp = unknown>(invalidateTags?: ReadonlyArray<string>) {
    const qc = useQueryClient();
    const tags = invalidateTags ?? def.tags;
    return useMutation({
      mutationFn: (body: TBody) =>
        api<TResp>(def.baseUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
      onSuccess: () => tags.forEach(tag => qc.invalidateQueries({ queryKey: [tag] })),
    });
  }

  function useUpdate<
    TBody extends object,
    TResp = unknown,
    TList extends { id: string | number } = { id: string | number },
    TDetail extends object = TList
  >(
    invalidate: (vars: { id: string | number; body: TBody }) => ReadonlyArray<string> = () => def.tags
  ) {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, body }: { id: string | number; body: TBody }) =>
        api<TResp>(`${def.baseUrl}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),

      onMutate: async (vars) => {
        await qc.cancelQueries({ queryKey: [def.entity] });

        const prevList = qc.getQueriesData<TList[]>({ queryKey: [def.entity] });
        const prevDetail = qc.getQueryData<TDetail>(keyFactory.detail(def.entity, vars.id));

        qc.setQueriesData<TList[]>({ queryKey: [def.entity] }, (old) => {
          if (!old) return old;
          return old.map((item) => item.id === vars.id ? { ...item, ...vars.body } as TList : item);
        });

        qc.setQueryData<TDetail>(keyFactory.detail(def.entity, vars.id), (old) => {
          if (!old) return old;
          return { ...old, ...vars.body } as TDetail;
        });

        return { prevList, prevDetail };
      },

      onError: (_err, vars, ctx) => {
        ctx?.prevList?.forEach(([key, data]) => qc.setQueryData<TList[]>(key, data));
        if (ctx?.prevDetail) {
          qc.setQueryData<TDetail>(keyFactory.detail(def.entity, vars.id), ctx.prevDetail);
        }
      },

      onSettled: (_data, _error, vars) => {
        invalidate(vars).forEach(tag => qc.invalidateQueries({ queryKey: [tag] }));
      },
    });
  }

  function useDelete<
    TResp = unknown,
    TList extends { id: string | number } = { id: string | number }
  >(invalidateTags?: ReadonlyArray<string>) {
    const qc = useQueryClient();
    const tags = invalidateTags ?? def.tags;
    return useMutation({
      mutationFn: (id: string | number) =>
        api<TResp>(`${def.baseUrl}/${id}`, { method: "DELETE" }),

      onMutate: async (id) => {
        await qc.cancelQueries({ queryKey: [def.entity] });

        const prevList = qc.getQueriesData<TList[]>({ queryKey: [def.entity] });
        qc.setQueriesData<TList[]>({ queryKey: [def.entity] }, (old) => {
          if (!old) return old;
          return old.filter((item) => item.id !== id);
        });

        return { prevList };
      },

      onError: (_err, _id, ctx) => {
        ctx?.prevList?.forEach(([key, data]) => qc.setQueryData<TList[]>(key, data));
      },

      onSettled: () => {
        tags.forEach(tag => qc.invalidateQueries({ queryKey: [tag] }));
      },
    });
  }

  return { useList, useDetail, useCreate, useUpdate, useDelete };
}
