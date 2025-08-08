# 🎯 Zustand Best Practices

## 📋 Nguyên tắc cốt lõi

### 1. ✅ Selector thuần (Pure Selectors)

```typescript
// ✅ ĐÚNG - Selector thuần, không side-effect
const selectFilters = (state: State) =>
  [state.search, state.page, state.sortBy] as const;

// ❌ SAI - Có side-effect trong selector
const selectFilters = (state: State) => {
  console.log("render"); // Side-effect!
  return [state.search, state.page];
};
```

### 2. ✅ Không trả về object/array mới mỗi render

```typescript
// ✅ ĐÚNG - Dùng tuple + shallow
const [search, page] = useStore(selectFilters, shallow);

// ❌ SAI - Tạo object mới mỗi render
const { search, page } = useStore((state) => ({
  search: state.search,
  page: state.page,
})); // Không có shallow!
```

### 3. ✅ Dùng tuple + shallow khi lấy nhiều field

```typescript
// ✅ ĐÚNG - Tuple với shallow
const selectMultiple = (state: State) =>
  [state.field1, state.field2, state.field3] as const;

export const useMultiple = () => {
  const [field1, field2, field3] = useStore(selectMultiple, shallow);
  return { field1, field2, field3 };
};

// ❌ SAI - Nhiều useStore calls
export const useMultiple = () => {
  const field1 = useStore((state) => state.field1);
  const field2 = useStore((state) => state.field2);
  const field3 = useStore((state) => state.field3);
  return { field1, field2, field3 };
};
```

### 4. ✅ Mọi useEffect có guard trước khi set

```typescript
// ✅ ĐÚNG - Có guard condition
useEffect(() => {
  if (urlParams.search !== search) {
    setSearch(urlParams.search);
  }
}, [urlParams.search, search, setSearch]);

// ❌ SAI - Không có guard, gây infinite loop
useEffect(() => {
  setSearch(urlParams.search); // Luôn set!
}, [urlParams.search, setSearch]);
```

### 5. ✅ Không dựa vào giá trị "không ổn định" trong selector

```typescript
// ✅ ĐÚNG - Selector ổn định
const selectStable = (state: State) => state.stableValue;

// ❌ SAI - Dựa vào Date.now(), Math.random(), etc
const selectUnstable = (state: State) => ({
  value: state.value,
  timestamp: Date.now(), // Không ổn định!
});
```

### 6. ✅ Subscription có unsub và có so sánh trước khi set

```typescript
// ✅ ĐÚNG - Có cleanup và comparison
useEffect(() => {
  const unsubscribe = store.subscribe((state) => {
    if (state.value !== prevValue) {
      setPrevValue(state.value);
    }
  });

  return unsubscribe; // Cleanup
}, []);

// ❌ SAI - Không cleanup, không so sánh
useEffect(() => {
  store.subscribe((state) => {
    setPrevValue(state.value); // Luôn set!
  });
  // Không cleanup!
}, []);
```

### 7. ✅ Với persist, đợi hydrate xong rồi mới sync

```typescript
// ✅ ĐÚNG - Đợi hydration
const usePersistedStore = create(
  persist((set) => ({ value: 0 }), { name: "store" })
);

export const useHydratedStore = () => {
  const [hydrated, setHydrated] = useState(false);
  const store = usePersistedStore();

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated ? store : null;
};

// ❌ SAI - Sync ngay lập tức
export const useBadStore = () => {
  const store = usePersistedStore();

  useEffect(() => {
    syncWithURL(store); // Chưa hydrate!
  }, [store]);

  return store;
};
```

## 🏗️ Cấu trúc Store tốt

### Store Factory Pattern

```typescript
// ✅ Store factory với middleware
export const makeStore = <T>(
  initializer: StateCreator<T>,
  options: { name?: string; persist?: boolean } = {}
) => {
  return create<T>()(
    subscribeWithSelector(
      devtools(
        options.persist
          ? persist(initializer, { name: options.name })
          : initializer,
        { name: options.name }
      )
    )
  );
};
```

### Selector Pattern

```typescript
// ✅ Cached selectors bên ngoài component
const selectFilters = (state: State) =>
  [state.search, state.page, state.pageSize] as const;

const selectActions = (state: State) =>
  [state.setSearch, state.setPage, state.reset] as const;

// ✅ Hook với tuple destructuring
export const useFilters = () => {
  const [search, page, pageSize] = useStore(selectFilters, shallow);
  return { search, page, pageSize };
};

export const useActions = () => {
  const [setSearch, setPage, reset] = useStore(selectActions, shallow);
  return { setSearch, setPage, reset };
};
```

## 🚫 Anti-patterns phổ biến

### 1. ❌ Inline selectors

```typescript
// ❌ SAI - Tạo function mới mỗi render
const Component = () => {
  const data = useStore((state) => ({
    // Function mới!
    search: state.search,
    page: state.page,
  }));
};
```

### 2. ❌ Nested objects trong state

```typescript
// ❌ SAI - Nested objects khó optimize
interface BadState {
  filters: {
    search: string;
    pagination: {
      page: number;
      size: number;
    };
  };
}

// ✅ ĐÚNG - Flat structure
interface GoodState {
  search: string;
  page: number;
  pageSize: number;
}
```

### 3. ❌ Actions trong selectors

```typescript
// ❌ SAI - Mix data và actions
const selectEverything = (state: State) => ({
  search: state.search,
  setSearch: state.setSearch, // Action trong selector!
});

// ✅ ĐÚNG - Tách riêng
const selectData = (state: State) => state.search;
const selectActions = (state: State) => state.setSearch;
```

## 🎯 Checklist

Trước khi commit code Zustand:

- [ ] Selectors thuần, không side-effect
- [ ] Dùng shallow khi select nhiều field
- [ ] Dùng tuple thay vì object khi có thể
- [ ] useEffect có guard conditions
- [ ] Subscriptions có cleanup
- [ ] Persist stores đợi hydration
- [ ] Không có inline selectors
- [ ] State structure phẳng
- [ ] Tách riêng data và actions

## 🔍 Debug Tips

### 1. Kiểm tra re-renders

```typescript
// Thêm vào selector để debug
const selectDebug = (state: State) => {
  console.log("Selector called"); // Nếu log liên tục = infinite loop
  return state.value;
};
```

### 2. Kiểm tra shallow equality

```typescript
// Test shallow comparison
const prev = [1, 2, 3];
const next = [1, 2, 3];
console.log(shallow(prev, next)); // true

const prevObj = { a: 1, b: 2 };
const nextObj = { a: 1, b: 2 };
console.log(shallow(prevObj, nextObj)); // true
```

### 3. DevTools naming

```typescript
// Đặt tên rõ ràng cho DevTools
const useFeatureStore = makeStore(
  (set) => ({ ... }),
  { name: 'feature-ui' } // Hiện trong DevTools
);
```

---

**Nhớ**: Zustand đơn giản nhưng cần tuân thủ nguyên tắc để tránh performance issues!
