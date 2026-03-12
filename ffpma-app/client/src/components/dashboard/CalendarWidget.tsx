import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Clock, Video, VideoOff, RefreshCw, AlertCircle, CalendarDays } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO, isToday, isTomorrow } from "date-fns";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  htmlLink: string;
  hangoutLink?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
}

export function CalendarWidget() {
  const { data: events, isLoading, error, refetch, isRefetching } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/events"],
    queryFn: async () => {
      const res = await fetch("/api/calendar/events");
      if (!res.ok) {
        throw new Error("Failed to fetch calendar events");
      }
      return res.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const formatEventTime = (event: CalendarEvent) => {
    if (event.start.date) {
      // All-day event
      const date = parseISO(event.start.date);
      if (isToday(date)) return "Today (All Day)";
      if (isTomorrow(date)) return "Tomorrow (All Day)";
      return format(date, "MMM d (All Day)");
    }
    
    if (event.start.dateTime) {
      const date = parseISO(event.start.dateTime);
      let dayStr = format(date, "MMM d");
      if (isToday(date)) dayStr = "Today";
      else if (isTomorrow(date)) dayStr = "Tomorrow";
      
      return `${dayStr}, ${format(date, "h:mm a")}`;
    }
    
    return "Unknown Time";
  };

  if (error) {
    return (
      <Card className="bg-black/20 border-white/10 h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-rose-400">
            <AlertCircle className="w-5 h-5" />
            Calendar Error
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-white/50 mb-4 px-4">
            Could not connect to Google Calendar. Make sure your OAuth credentials are configured.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/20 border-white/10 h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-400" />
              Upcoming Schedule
            </CardTitle>
            <CardDescription>Synced via Google Workspace</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 rounded-full hover:bg-white/10" 
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
          >
            <RefreshCw className={`w-4 h-4 text-white/60 ${(isLoading || isRefetching) ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 relative flex flex-col min-h-0">
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          ) : !events || events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                <CalendarIcon className="w-6 h-6 text-white/30" />
              </div>
              <p className="text-white/50 text-sm">No upcoming appointments scheduled.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {events.map((event, index) => {
                const isVideo = !!event.hangoutLink;
                return (
                  <div 
                    key={event.id}
                    className={`flex items-start gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${index === 0 ? 'bg-indigo-500/5' : ''}`}
                  >
                    <div className="flex flex-col items-center justify-center w-12 pt-1 flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${index === 0 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-white/60'}`}>
                        {index === 0 ? <Clock className="w-5 h-5 animate-pulse" /> : <CalendarIcon className="w-4 h-4" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <a 
                          href={event.htmlLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-sm text-white hover:text-indigo-300 transition-colors line-clamp-1"
                        >
                          {event.summary || "Untitled Event"}
                        </a>
                      </div>
                      
                      <p className="text-xs text-indigo-300 font-medium mb-2">
                        {formatEventTime(event)}
                      </p>
                      
                      {event.description && (
                         <p className="text-xs text-white/50 line-clamp-2 mb-3">
                           {event.description}
                         </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-auto">
                        {isVideo ? (
                          <a href={event.hangoutLink} target="_blank" rel="noopener noreferrer">
                            <Badge className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 cursor-pointer border border-emerald-500/30">
                              <Video className="w-3 h-3 mr-1" />
                              Join Meet
                            </Badge>
                          </a>
                        ) : (
                          <Badge variant="outline" className="text-white/40 border-white/10 bg-black/20">
                            <VideoOff className="w-3 h-3 mr-1" />
                            No Video
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
