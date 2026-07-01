"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, getStatusColor } from "@/lib/utils";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") fetchNotifications();
  }, [status]);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data);
    } catch {
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      toast.success("All marked as read");
      fetchNotifications();
    } catch {
      toast.error("Failed to update notifications");
    }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-8 w-8 border-4 border-[#1a71b4] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with system notifications</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}>
          <CheckCheck className="h-4 w-4 mr-2" />
          Mark All Read
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No notifications</p>
            </div>
          ) : (
            notifications.map((n: any) => (
              <div key={n.id} className={`flex items-start gap-4 p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${!n.read ? 'bg-[#1a71b4]/5' : ''}`}>
                <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${n.read ? 'bg-transparent' : 'bg-[#1a71b4]'}`} />
                <div className="flex-1 min-w-0">
                  <Link href={n.link || "#"}>
                    <p className="text-sm font-medium text-foreground hover:text-[#1a71b4]">{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDateTime(n.createdAt)}</p>
                  </Link>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}