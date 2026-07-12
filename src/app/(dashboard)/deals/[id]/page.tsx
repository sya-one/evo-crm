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
import { formatCurrency, formatDate, formatDateTime, getStatusColor, getInitials } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft, Building2, Mail, Phone, User, TrendingUp, FileText, HelpCircle,
  Activity, DollarSign, Calendar, Clock, MessageSquare, Paperclip, Trash2,
  Send, Plus, Edit3, X, Check, AlertTriangle, Loader2, ExternalLink,
} from "lucide-react";

type TabType = "overview" | "timeline" | "conversation" | "notes" | "related";

export default function DealDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [newMessage, setNewMessage] = useState("");
  const [newNote, setNewNote] = useState("");
  const [sending, setSending] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");

  const fetchDeal = useCallback(async () => {
    try {
      const res = await fetch(`/api/deals/${params.id}`);
      if (!res.ok) { router.push("/deals"); return; }
      setDeal(await res.json());
    } catch { router.push("/deals"); }
    finally { setLoading(false); }
  }, [params.id, router]);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") fetchDeal();
  }, [status, fetchDeal, router]);

  async function sendMessage() {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentType: "deal", parentId: params.id, message: newMessage }),
      });
      if (res.ok) { setNewMessage(""); fetchDeal(); toast.success("Message sent"); }
    } catch { toast.error("Failed to send"); }
    finally { setSending(false); }
  }

  async function addNote() {
    if (!newNote.trim()) return;
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentType: "deal", parentId: params.id, content: newNote }),
      });
      if (res.ok) { setNewNote(""); fetchDeal(); toast.success("Note added"); }
    } catch { toast.error("Failed to add note"); }
  }

  async function deleteNote(id: string) {
    try {
      await fetch("/api/notes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      fetchDeal(); toast.success("Note deleted");
    } catch { toast.error("Failed to delete"); }
  }

  async function updateNote(id: string, content: string) {
    try {
      await fetch("/api/notes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, content }) });
      setEditingNote(null); fetchDeal(); toast.success("Note updated");
    } catch { toast.error("Failed to update"); }
  }

  async function updateDeal(data: any) {
    try {
      const res = await fetch(`/api/deals/${params.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (res.ok) { fetchDeal(); toast.success("Updated"); }
    } catch { toast.error("Failed to update"); }
  }

  async function deleteDeal() {
    if (!confirm("Delete this deal?")) return;
    try {
      await fetch(`/api/deals/${params.id}`, { method: "DELETE" });
      toast.success("Deal deleted"); router.push("/deals");
    } catch { toast.error("Failed to delete"); }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-8 w-8 border-4 border-[#1a71b4] border-t-transparent rounded-full" /></div>;
  if (!deal) return null;

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
        <Button variant="ghost" size="icon" onClick={() => router.push("/deals")}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground truncate">{deal.name}</h1>
            <Badge className={getStatusColor(deal.stage)} variant="outline">{deal.stage}</Badge>
            <Badge className={getStatusColor(deal.priority)} variant="outline">{deal.priority}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Created {formatDate(deal.createdAt)} • Updated {formatDate(deal.updatedAt)} • Owner: {deal.owner?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Select onValueChange={(v) => updateDeal({ stage: v })}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Move to..." /></SelectTrigger>
            <SelectContent>
              {["NEW","CONTACTED","QUALIFIED","PROPOSAL_SENT","NEGOTIATION","WON","LOST"].map(s => (
                <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="destructive" size="sm" onClick={deleteDeal}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card"><CardContent className="p-4">
          <DollarSign className="h-5 w-5 text-green-500 mb-1" />
          <p className="text-2xl font-bold text-foreground">{formatCurrency(deal.value)}</p>
          <p className="text-xs text-muted-foreground">Deal Value</p>
        </CardContent></Card>
        <Card className="stat-card"><CardContent className="p-4">
          <Calendar className="h-5 w-5 text-blue-500 mb-1" />
          <p className="text-2xl font-bold text-foreground">{deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : "TBD"}</p>
          <p className="text-xs text-muted-foreground">Expected Close</p>
        </CardContent></Card>
        <Card className="stat-card"><CardContent className="p-4">
          <Activity className="h-5 w-5 text-purple-500 mb-1" />
          <p className="text-2xl font-bold text-foreground">{deal.activities?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Activities</p>
        </CardContent></Card>
        <Card className="stat-card"><CardContent className="p-4">
          <MessageSquare className="h-5 w-5 text-orange-500 mb-1" />
          <p className="text-2xl font-bold text-foreground">{deal.conversations?.[0]?.messages?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Messages</p>
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
        {/* Left - Client Info */}
        <div className="space-y-6">
          <Card><CardHeader><CardTitle className="text-lg">Client Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full sidebar-gradient flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(deal.client?.name)}
                </div>
                <div>
                  <Link href={`/clients/${deal.client?.id}`} className="text-sm font-medium text-foreground hover:text-[#1a71b4]">{deal.client?.name}</Link>
                  {deal.client?.company && <p className="text-xs text-muted-foreground">{deal.client.company}</p>}
                </div>
              </div>
              {deal.client?.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />{deal.client.email}</div>}
              {deal.client?.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{deal.client.phone}</div>}
              {deal.client?.consultant && <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-muted-foreground" />Consultant: {deal.client.consultant.name}</div>}
              {deal.client?.manager && <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-muted-foreground" />Manager: {deal.client.manager.name}</div>}
            </CardContent>
          </Card>

          <Card><CardHeader><CardTitle className="text-lg">Deal Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="font-medium">{deal.owner?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Stage</span><Badge className={getStatusColor(deal.stage)} variant="outline">{deal.stage}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><Badge className={getStatusColor(deal.priority)} variant="outline">{deal.priority}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Value</span><span className="font-bold">{formatCurrency(deal.value)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Close Date</span><span>{deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : "TBD"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{formatDate(deal.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Updated</span><span>{formatDate(deal.updatedAt)}</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Right - Tab Content */}
        <div className="lg:col-span-2">
          {/* Overview */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <Card><CardHeader><CardTitle className="text-lg">Activity Timeline</CardTitle></CardHeader>
                <CardContent>
                  {deal.activities?.slice(0, 8).map((a: any) => (
                    <div key={a.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                      <div className="h-8 w-8 rounded-full bg-[#1a71b4]/10 flex items-center justify-center flex-shrink-0">
                        <Activity className="h-4 w-4 text-[#1a71b4]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{a.message}</p>
                        <p className="text-xs text-muted-foreground">{a.user?.name} • {formatDateTime(a.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                  {(!deal.activities || deal.activities.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No activity</p>}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Timeline */}
          {activeTab === "timeline" && (
            <Card><CardHeader><CardTitle className="text-lg">Full Timeline</CardTitle></CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  {deal.activities?.map((a: any) => (
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
                  {(!deal.activities || deal.activities.length === 0) && <p className="text-sm text-muted-foreground text-center py-8">No activity</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conversation */}
          {activeTab === "conversation" && (
            <Card><CardHeader><CardTitle className="text-lg">Conversation</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                  {deal.conversations?.[0]?.messages?.map((m: any) => (
                    <div key={m.id} className={`flex gap-3 ${m.userId === (session?.user as any)?.id ? "flex-row-reverse" : ""}`}>
                      <div className="h-8 w-8 rounded-full sidebar-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {getInitials(m.user?.name)}
                      </div>
                      <div className={`max-w-[75%] rounded-lg p-3 ${
                        m.userId === (session?.user as any)?.id
                          ? "bg-[#1a71b4] text-white"
                          : "bg-muted"
                      }`}>
                        <p className="text-xs font-medium mb-1">{m.user?.name}</p>
                        <p className="text-sm">{m.message}</p>
                        <p className="text-xs mt-1 opacity-70">{formatDateTime(m.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                  {(!deal.conversations?.[0]?.messages || deal.conversations[0].messages.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>
                  )}
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

          {/* Notes */}
          {activeTab === "notes" && (
            <Card><CardHeader><CardTitle className="text-lg">Notes</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note..." rows={2} />
                  <Button size="sm" className="sidebar-gradient self-end" onClick={addNote}><Plus className="h-4 w-4 mr-1" />Add</Button>
                </div>
                {deal.notes?.map((n: any) => (
                  <div key={n.id} className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full sidebar-gradient flex items-center justify-center text-white text-[10px] font-bold">
                          {getInitials(n.user?.name)}
                        </div>
                        <span className="text-sm font-medium">{n.user?.name}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingNote(n.id); setEditNoteContent(n.content); }}>
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => deleteNote(n.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {editingNote === n.id ? (
                      <div className="space-y-2">
                        <Textarea value={editNoteContent} onChange={e => setEditNoteContent(e.target.value)} rows={2} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateNote(n.id, editNoteContent)}><Check className="h-3 w-3 mr-1" />Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingNote(null)}><X className="h-3 w-3 mr-1" />Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground whitespace-pre-wrap">{n.content}</p>
                    )}
                  </div>
                ))}
                {(!deal.notes || deal.notes.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No notes</p>}
              </CardContent>
            </Card>
          )}

          {/* Related */}
          {activeTab === "related" && (
            <div className="space-y-4">
              <Card><CardHeader><CardTitle className="text-lg">Other Deals for {deal.client?.name}</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {deal.client?.deals?.map((d: any) => (
                    <Link key={d.id} href={`/deals/${d.id}`}>
                      <div className="flex items-center justify-between p-3 border-b border-border hover:bg-muted/50 transition-colors">
                        <div><p className="text-sm font-medium">{d.name}</p><Badge className={getStatusColor(d.stage)} variant="outline">{d.stage}</Badge></div>
                        <p className="text-sm font-bold">{formatCurrency(d.value)}</p>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
              <Card><CardHeader><CardTitle className="text-lg">Claims</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {deal.client?.claims?.map((c: any) => (
                    <Link key={c.id} href={`/claims/${c.id}`}>
                      <div className="flex items-center justify-between p-3 border-b border-border hover:bg-muted/50 transition-colors">
                        <div><p className="text-sm font-medium text-[#1a71b4]">{c.claimNumber}</p><Badge className={getStatusColor(c.status)} variant="outline">{c.status}</Badge></div>
                        <p className="text-xs text-muted-foreground">{c.department || "-"}</p>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
              <Card><CardHeader><CardTitle className="text-lg">Queries</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {deal.client?.queries?.map((q: any) => (
                    <Link key={q.id} href={`/queries/${q.id}`}>
                      <div className="flex items-center justify-between p-3 border-b border-border hover:bg-muted/50 transition-colors">
                        <div><p className="text-sm font-medium text-[#1a71b4]">{q.queryNumber}</p><Badge className={getStatusColor(q.status)} variant="outline">{q.status}</Badge></div>
                        <p className="text-xs text-muted-foreground">{q.department || "-"}</p>
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