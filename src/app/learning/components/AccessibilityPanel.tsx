"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  EyeOff,
  Type,
  Keyboard,
  Volume2,
  Settings,
  Accessibility,
  Contrast,
  MousePointer,
} from "lucide-react";
import { useAccessibility } from "../contexts/AccessibilityContext";
import { cn } from "@/lib/utils";

interface AccessibilityPanelProps {
  className?: string;
  onClose?: () => void;
}

export const AccessibilityPanel = React.memo(function AccessibilityPanel({
  className,
  onClose,
}: AccessibilityPanelProps) {
  const {
    settings,
    updateSettings,
    isHighContrastMode,
    toggleHighContrast,
    announce,
  } = useAccessibility();

  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleHighContrast = () => {
    toggleHighContrast();
    announce(
      isHighContrastMode
        ? "Đã tắt chế độ tương phản cao"
        : "Đã bật chế độ tương phản cao",
      "assertive"
    );
  };

  const handleFontSizeChange = (fontSize: typeof settings.fontSize) => {
    updateSettings({ fontSize });
    announce(`Đã thay đổi kích thước chữ thành ${fontSize}`, "polite");
  };

  const handleToggleReducedMotion = () => {
    const newValue = !settings.reducedMotion;
    updateSettings({ reducedMotion: newValue });
    announce(
      newValue
        ? "Đã bật chế độ giảm chuyển động"
        : "Đã tắt chế độ giảm chuyển động",
      "polite"
    );
  };

  const handleToggleKeyboardNavigation = () => {
    const newValue = !settings.keyboardNavigation;
    updateSettings({ keyboardNavigation: newValue });
    announce(
      newValue
        ? "Đã bật điều hướng bằng bàn phím"
        : "Đã tắt điều hướng bằng bàn phím",
      "polite"
    );
  };

  const handleToggleScreenReader = () => {
    const newValue = !settings.screenReaderOptimized;
    updateSettings({ screenReaderOptimized: newValue });
    announce(
      newValue
        ? "Đã bật tối ưu hóa cho trình đọc màn hình"
        : "Đã tắt tối ưu hóa cho trình đọc màn hình",
      "polite"
    );
  };

  const resetToDefaults = () => {
    updateSettings({
      highContrast: false,
      reducedMotion: false,
      fontSize: "medium",
      keyboardNavigation: true,
      screenReaderOptimized: false,
    });
    announce("Đã đặt lại cài đặt trợ năng về mặc định", "polite");
  };

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            Cài đặt trợ năng
          </CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Đóng bảng cài đặt trợ năng"
            >
              ✕
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Access Toggle */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Truy cập nhanh</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls="accessibility-settings"
          >
            {isExpanded ? "Thu gọn" : "Mở rộng"}
          </Button>
        </div>

        {/* High Contrast Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Contrast className="h-5 w-5 text-gray-600" />
            <div>
              <h3 className="font-medium">Chế độ tương phản cao</h3>
              <p className="text-sm text-gray-600">
                Tăng độ tương phản màu sắc để dễ nhìn hơn
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isHighContrastMode ? "default" : "secondary"}>
              {isHighContrastMode ? "Bật" : "Tắt"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleHighContrast}
              aria-pressed={isHighContrastMode}
              aria-label={`${isHighContrastMode ? "Tắt" : "Bật"} chế độ tương phản cao`}
            >
              {isHighContrastMode ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Font Size */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Type className="h-5 w-5 text-gray-600" />
            <div>
              <h3 className="font-medium">Kích thước chữ</h3>
              <p className="text-sm text-gray-600">
                Điều chỉnh kích thước chữ cho dễ đọc
              </p>
            </div>
          </div>
          <Select
            value={settings.fontSize}
            onValueChange={(value) =>
              handleFontSizeChange(value as typeof settings.fontSize)
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Nhỏ</SelectItem>
              <SelectItem value="medium">Vừa</SelectItem>
              <SelectItem value="large">Lớn</SelectItem>
              <SelectItem value="extra-large">Rất lớn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expanded Settings */}
        {isExpanded && (
          <div id="accessibility-settings" className="space-y-4 pt-4 border-t">
            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MousePointer className="h-5 w-5 text-gray-600" />
                <div>
                  <h3 className="font-medium">Giảm chuyển động</h3>
                  <p className="text-sm text-gray-600">
                    Giảm hiệu ứng chuyển động và hoạt hình
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={settings.reducedMotion ? "default" : "secondary"}
                >
                  {settings.reducedMotion ? "Bật" : "Tắt"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleReducedMotion}
                  aria-pressed={settings.reducedMotion}
                  aria-label={`${settings.reducedMotion ? "Tắt" : "Bật"} chế độ giảm chuyển động`}
                >
                  {settings.reducedMotion ? "Tắt" : "Bật"}
                </Button>
              </div>
            </div>

            {/* Keyboard Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Keyboard className="h-5 w-5 text-gray-600" />
                <div>
                  <h3 className="font-medium">Điều hướng bàn phím</h3>
                  <p className="text-sm text-gray-600">
                    Cho phép điều hướng bằng phím mũi tên và phím tắt
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    settings.keyboardNavigation ? "default" : "secondary"
                  }
                >
                  {settings.keyboardNavigation ? "Bật" : "Tắt"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleKeyboardNavigation}
                  aria-pressed={settings.keyboardNavigation}
                  aria-label={`${settings.keyboardNavigation ? "Tắt" : "Bật"} điều hướng bàn phím`}
                >
                  {settings.keyboardNavigation ? "Tắt" : "Bật"}
                </Button>
              </div>
            </div>

            {/* Screen Reader Optimization */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-gray-600" />
                <div>
                  <h3 className="font-medium">Tối ưu trình đọc màn hình</h3>
                  <p className="text-sm text-gray-600">
                    Cải thiện trải nghiệm với trình đọc màn hình
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    settings.screenReaderOptimized ? "default" : "secondary"
                  }
                >
                  {settings.screenReaderOptimized ? "Bật" : "Tắt"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleScreenReader}
                  aria-pressed={settings.screenReaderOptimized}
                  aria-label={`${settings.screenReaderOptimized ? "Tắt" : "Bật"} tối ưu hóa trình đọc màn hình`}
                >
                  {settings.screenReaderOptimized ? "Tắt" : "Bật"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Phím tắt hữu ích:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <kbd className="px-1 py-0.5 bg-gray-200 rounded">Tab</kbd> -
              Chuyển tiếp
            </div>
            <div>
              <kbd className="px-1 py-0.5 bg-gray-200 rounded">Shift+Tab</kbd> -
              Chuyển lùi
            </div>
            <div>
              <kbd className="px-1 py-0.5 bg-gray-200 rounded">Enter</kbd> -
              Kích hoạt
            </div>
            <div>
              <kbd className="px-1 py-0.5 bg-gray-200 rounded">Space</kbd> -
              Chọn/Phát
            </div>
            <div>
              <kbd className="px-1 py-0.5 bg-gray-200 rounded">Esc</kbd> -
              Đóng/Hủy
            </div>
            <div>
              <kbd className="px-1 py-0.5 bg-gray-200 rounded">↑↓←→</kbd> - Điều
              hướng
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="text-gray-600"
          >
            Đặt lại mặc định
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
