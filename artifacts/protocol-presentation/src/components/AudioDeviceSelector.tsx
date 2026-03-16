import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";

interface AudioDeviceSelectorProps {
  outputDevices: MediaDeviceInfo[];
  selectedDevice: string;
  onDeviceChange: (deviceId: string) => void;
  fallbackNotification?: string | null;
  onDismissNotification?: () => void;
}

export function AudioDeviceSelector({
  outputDevices,
  selectedDevice,
  onDeviceChange,
  fallbackNotification,
  onDismissNotification,
}: AudioDeviceSelectorProps) {
  if (outputDevices.length <= 1 && !fallbackNotification) return null;

  return (
    <div className="flex items-center gap-2">
      {fallbackNotification && (
        <div className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: "rgba(255,180,0,0.15)", color: "#FFB400" }}>
          <span>{fallbackNotification}</span>
          {onDismissNotification && (
            <button onClick={onDismissNotification} className="ml-1 opacity-70 hover:opacity-100">×</button>
          )}
        </div>
      )}

      {outputDevices.length > 1 && (
        <div className="flex items-center gap-2">
          <Label className="text-xs whitespace-nowrap" style={{ color: "#94a3b8" }}>
            🔊 Output:
          </Label>
          <Select value={selectedDevice} onValueChange={onDeviceChange}>
            <SelectTrigger className="h-7 text-xs min-w-[140px]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}>
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              {outputDevices.map(device => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Device ${device.deviceId.slice(0, 8)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
