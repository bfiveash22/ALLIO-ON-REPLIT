import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Bluetooth, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface AudioDeviceSelectorProps {
  outputDevices: MediaDeviceInfo[];
  selectedDevice: string;
  onDeviceChange: (deviceId: string) => void;
  fallbackNotification?: string | null;
  onDismissNotification?: () => void;
  compact?: boolean;
  label?: string;
  description?: string;
}

export function AudioDeviceSelector({
  outputDevices,
  selectedDevice,
  onDeviceChange,
  fallbackNotification,
  onDismissNotification,
  compact = false,
  label = "Audio Output Device",
  description = "Select a Bluetooth speaker or external device to route audio output",
}: AudioDeviceSelectorProps) {
  if (outputDevices.length <= 1 && !fallbackNotification) return null;

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <AnimatePresence>
        {fallbackNotification && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md px-3 py-2 text-xs text-yellow-600 dark:text-yellow-400"
          >
            <Bluetooth className="h-3 w-3 flex-shrink-0" />
            <span className="flex-1">{fallbackNotification}</span>
            {onDismissNotification && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0"
                onClick={onDismissNotification}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {outputDevices.length > 1 && (
        <>
          <Label className={`flex items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
            <Bluetooth className={compact ? "h-3 w-3" : "h-4 w-4"} />
            {label}
          </Label>
          <Select value={selectedDevice} onValueChange={onDeviceChange}>
            <SelectTrigger className={compact ? "h-8 text-xs" : ""}>
              <SelectValue placeholder="Default speakers" />
            </SelectTrigger>
            <SelectContent>
              {outputDevices.map(device => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Device ${device.deviceId.slice(0, 8)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!compact && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </>
      )}
    </div>
  );
}
