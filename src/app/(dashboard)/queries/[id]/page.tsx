"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, formatDateTime, getStatusColor, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft, Mail, Phone, User, FileText, HelpCircle, Activity, Calendar, Clock,
  MessageSquare, Trash2, Send, Plus, Edit3, X, Check, AlertTriangle, Loader2,
  ExternalLink, Building2,
} from "lucide-react";

type TabType = "overview" | "timeline" | "conversation" | "notes" | "related";

export default function QueryDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [query, setQuery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [newMessage, setNewMessage] = useState("");
  const [newNote, setNewNote] = useState("");
  const [sending, setSending] = useState(false);

  const fetchQuery = useCallback(async () => {
    try {
      const res = await fetch(`/api/queries/${params.id}`);
      if (!res.ok) { router.push("/queries"); return; }
      setQuery(await res.json());
    } catch { router.push("/queries"); }
    finally { setLoading(false); }
  }, [params.id, router]);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") fetchQuery();
  }, [status, fetchQuery, router]);

  async function sendMessage() {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentType: "query", parentId: params.id, message: newMessage }),
      });
      if (res.ok) { setNewMessage(""); fetchQuery(); toast.success("Message sent"); }
    } catch { toast.error("Failed to send"); }
    finally { setSending(false); }
  }

  async function addNote() {
    if (!newNote.trim()) return;
    try {
      const res = await fetch("/api/notes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentType: "query", parentId: params.id, content: newNote }),
      });
      if (res.ok) { setNewNote(""); fetchQuery(); toast.success("Note added"); }
    } catch { toast.error("Failed to add"); }
  }

  async function deleteNote(id: string) {
    try {
      await fetch("/api/notes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      fetchQuery(); toast.success("Note deleted");
    } catch { toast.error("Failed to delete"); }
  }

  async function updateQuery(data: any) {
    try {
      const res = await fetch(`/api/queries/${params.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (res.ok) { fetchQuery(); toast.success("Updated"); }
    } catch { toast.error("Failed to update"); }
  }

  async function deleteQuery() {
    if (!confirm("Delete this query?")) return;
    try {
      await fetch(`/api/queries/${params.id}`, { method: "DELETE" });
      toast.success("Query deleted"); router.push("/queries");
    } catch { toast.error("Failed to delete"); }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-8 w-8 border-4 border-[#1a71b4] border-t-transparent rounded-full" /></div>;
  if (!query) return null;

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: Activity },
    { id: "timeline" as TabType, label: "Timeline", icon: Clock },
    { id: "conversation" as TabType, label: "Conversation", icon: MessageSquare },
    { id: "notes" as TabType, label: "Notes", icon: FileText },
    { id: "related" as TabType, label: "Related", icon: ExternalLink },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => router.push("/queries")}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{query.queryNumber}</h1>
            <Badge className={getStatusColor(query.status)} variant="outline">{query.status}</Badge>
            <Badge className={getStatusColor(query.priority)} variant="outline">{query.priority}</Badge>
            {query.escalated && <Badge variant="danger">ESCALATED</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{query.description?.slice(0, 100)}</p>
        </div>
        <div className="flex gap-2">
          <Select onValueChange={(v) => updateQuery({ status: v })}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Change status..." /></SelectTrigger>
            <SelectContent>
              {["OPEN","IN_PROGRESS","RESOLVED","CLOSED"].map(s => (
                <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="destructive" size="sm" onClick={deleteQuery}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card"><CardContent className="p-4">
          <HelpCircle className="h-5 w-5 text-blue-500 mb-1" />
          <p className="text-2xl font-bold text-foreground">{query.queryNumber}</p>
          <p className="text-xs text-muted-foreground">Query Number</p>
        </CardContent></Card>
        <Card className="stat-card"><CardContent className="p-4">
          <Calendar className="h-5 w-5 text-orange-500 mb-1" />
          <p className="text-2xl font-bold text-foreground">{query.slaDueDate ? formatDate(query.slaDueDate) : "N/A"}</p>
          <p className="text-xs text-muted-foreground">SLA Due Date</p>
        </CardContent></Card>
        <Card className="stat-card"><CardContent className="p-4">
          <Activity className="h-5 w-5 text-purple-500 mb-1" />
          <p className="text-2xl font-bold text-foreground">{query.activities?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Activities</p>
        </CardContent></Card>
        <Card className="stat-card"><CardContent className="p-4">
          <Building2 className="h-5 w-5 text-green-500 mb-1" />
          <p className="text-2xl font-bold text-foreground">{query.department || "N/A"}</p>
          <p className="text-xs text-muted-foreground">Department</p>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            <tab.icon className="h-4 w-4" />{tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="space-y-6">
          <Card><CardHeader><CardTitle className="text-lg">Client Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full sidebar-gradient flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(query.client?.name)}
                </div>
                <div>
                  <Link href={`/clients/${query.client?.id}`} className="text-sm font-medium text-foreground hover:text-[#1a71b4]">{query.client?.name}</Link>
                  {query.client?.company && <p className="text-xs text-muted-foreground">{query.client.company}</p>}
                </div>
              </div>
              {query.client?.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />{query.client.email}</div>}
            </CardContent>
          </Card>

          <Card><CardHeader><CardTitle className="text-lg">Query Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Consultant</span><span className="font-medium">{query.consultant?.name || "Unassigned"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span>{query.department || "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={getStatusColor(query.status)} variant="outline">{query.status}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><Badge className={getStatusColor(query.priority)} variant="outline">{query.priority}</Badge></div>
              {query.escalated && <div className="flex justify-between"><span className="text-muted-foreground">Escalated</span><AlertTriangle className="h-4 w-4 text-red-500" /></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">SLA Due</span><span>{query.slaDueDate ? formatDate(query.slaDueDate) : "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{formatDate(query.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Updated</span><span>{formatDate(query.updatedAt)}</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Right */}
        <div className="lg:col-span-2">
          {activeTab === "overview" && (
            <Card><CardHeader><CardTitle className="text-lg">Description & Activity</CardTitle></CardHeader>
              <CardContent>
                {query.description && <p className="text-sm text-foreground whitespace-pre-wrap mb-4">{query.description}</p>}
                {query.activities?.slice(0, 6).map((a: any) => (
                  <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <div className="h-7 w-7 rounded-full bg-[#1a71b4]/10 flex items-center justify-center flex-shrink-0">
                      <Activity className="h-3.5 w-3.5 text-[#1a71b4]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{a.message}</p>
                      <p className="text-xs text-muted-foreground">{a.user?.name} • {formatDateTime(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === "timeline" && (
            <Card><CardHeader><CardTitle className="text-lg">Full Timeline</CardTitle></CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  {query.activities?.map((a: any) => (
                    <div key={a.id} className="relative flex items-start gap-4 pb-6 last:pb-0">
                      <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-[#1a71b4] bg-card z-10" />
                      <div className="ml-10 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">{a.type?.replace(/_/g, " ")}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</span>
                        </div>
                        <p className="text-sm text-foreground">{a.message}</p>
                        {a.user && <p className="text-xs text-muted-foreground mt-1">by {a.user.name}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "conversation" && (
            <Card><CardHeader><CardTitle className="text-lg">Conversation</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                  {query.conversations?.[0]?.messages?.map((m: any) => (
                    <div key={m.id} className={`flex gap-3 ${m.userId === (session?.user as any)?.id ? "flex-row-reverse" : ""}`}>
                      <div className="h-8 w-8 rounded-full sidebar-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {getInitials(m.user?.name)}
                      </div>
                      <div className={`max-w-[75%] rounded-lg p-3 ${m.userId === (session?.user as any)?.id ? "bg-[#1a71b4] text-white" : "bg-muted"}`}>
                        <p className="text-xs font-medium mb-1">{m.user?.name}</p>
                        <p className="text-sm">{m.message}</p>
                        <p className="text-xs mt-1 opacity-70">{formatDateTime(m.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..." onKeyDown={e => e.key === "Enter" && sendMessage()} />
                  <Button size="icon" onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notes" && (
            <Card><CardHeader><CardTitle className="text-lg">Notes</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note..." rows={2} />
                  <Button size="sm" className="sidebar-gradient self-end" onClick={addNote}><Plus className="h-4 w-4 mr-1" />Add</Button>
                </div>
                {query.notes?.map((n: any) => (
                  <div key={n.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-full sidebar-gradient flex items-center justify-center text-white text-[10px] font-bold">{getInitials(n.user?.name)}</div>
                      <span className="text-sm font-medium">{n.user?.name}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto text-red-500" onClick={() => deleteNote(n.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{n.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === "related" && (
            <div className="space-y-4">
              <Card><CardHeader><CardTitle className="text-lg">Deals for {query.client?.name}</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {query.client?.deals?.map((d: any) => (
                    <Link key={d.id} href={`/deals/${d.id}`}>
                      <div className="flex items-center justify-between p-3 border-b border-border hover:bg-muted/50">
                        <p className="text-sm font-medium">{d.name}</p>
                        <Badge className={getStatusColor(d.stage)} variant="outline">{d.stage}</Badge>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
              <Card><CardHeader><CardTitle className="text-lg">Claims</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {query.client?.claims?.map((c: any) => (
                    <Link key={c.id} href={`/claims/${c.id}`}>
                      <div className="flex items-center justify-between p-3 border-b border-border hover:bg-muted/50">
                        <p className="text-sm font-medium text-[#1a71b4]">{c.claimNumber}</p>
                        <Badge className={getStatusColor(c.status)} variant="outline">{c.status}</Badge>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
              <Card><CardHeader><CardTitle className="text-lg">Other Queries</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {query.client?.queries?.filter((q: any) => q.id !== query.id).map((q: any) => (
                    <Link key={q.id} href={`/queries/${q.id}`}>
                      <div className="flex items-center justify-between p-3 border-b border-border hover:bg-muted/50">
                        <p className="text-sm font-medium text-[#1a71b4]">{q.queryNumber}</p>
                        <Badge className={getStatusColor(q.status)} variant="outline">{q.status}</Badge>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}