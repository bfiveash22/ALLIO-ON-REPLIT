import { useState, useEffect, useCallback, useRef } from "react";

interface SinkIdCapable {
  setSinkId(sinkId: string): Promise<void>;
}

type AudioOutputTarget = HTMLAudioElement | HTMLVideoElement | AudioContext;

function hasSinkId(element: AudioOutputTarget): element is AudioOutputTarget & SinkIdCapable {
  return "setSinkId" in element && typeof (element as AudioOutputTarget & Partial<SinkIdCapable>).setSinkId === "function";
}

const STORAGE_KEY = "preferred-audio-output-device";

export function useAudioOutputDevice() {
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "default";
    } catch {
      return "default";
    }
  });
  const [fallbackNotification, setFallbackNotification] = useState<string | null>(null);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshDevices = useCallback(async () => {
    try {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {}

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(d => d.kind === "audiooutput");
      setOutputDevices(audioOutputs);

      if (selectedDevice !== "default") {
        const stillConnected = audioOutputs.some(d => d.deviceId === selectedDevice);
        if (!stillConnected) {
          setSelectedDevice("default");
          try {
            localStorage.setItem(STORAGE_KEY, "default");
          } catch {}
          setFallbackNotification("Audio device disconnected. Switched to default output.");
          if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
          notificationTimeoutRef.current = setTimeout(() => setFallbackNotification(null), 5000);
        }
      }
    } catch {}
  }, [selectedDevice]);

  useEffect(() => {
    refreshDevices();
    const handleDeviceChange = () => refreshDevices();
    navigator.mediaDevices?.addEventListener("devicechange", handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener("devicechange", handleDeviceChange);
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    };
  }, [refreshDevices]);

  const selectDevice = useCallback((deviceId: string) => {
    setSelectedDevice(deviceId);
    try {
      localStorage.setItem(STORAGE_KEY, deviceId);
    } catch {}
  }, []);

  const applySinkId = useCallback(async (element: AudioOutputTarget) => {
    if (hasSinkId(element)) {
      try {
        await element.setSinkId(selectedDevice === "default" ? "" : selectedDevice);
      } catch (e) {
        console.warn("Could not set audio output device:", e);
      }
    }
  }, [selectedDevice]);

  const dismissNotification = useCallback(() => {
    setFallbackNotification(null);
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
  }, []);

  return {
    outputDevices,
    selectedDevice,
    selectDevice,
    applySinkId,
    fallbackNotification,
    dismissNotification,
    refreshDevices,
  };
}
