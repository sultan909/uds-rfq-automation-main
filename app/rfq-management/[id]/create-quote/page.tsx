"use client";

import React from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CreateQuoteProps {
  params: Promise<{ id: string }>;
}

export default function CreateQuote({ params }: CreateQuoteProps) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = React.useState({
    amount: "",
    currency: "CAD",
    validUntil: "",
    terms: "",
    notes: ""
  });
  const [loading, setLoading] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/rfq/${id}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          currency: form.currency,
          validUntil: form.validUntil,
          terms: form.terms,
          notes: form.notes,
          vendorId: 1 // Default vendor - should be configurable
        })
      });
      if (res.ok) {
        toast.success("Quote created successfully");
        router.push(`/rfq-management/${id}`);
      } else {
        toast.error("Failed to create quote");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Create Quote" subtitle="Submit a new quote for this RFQ" />
        <div className="flex-1 overflow-auto p-4 flex justify-center items-center">
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle>Create Quote</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">Amount</label>
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Currency</label>
                  <Input
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Valid Until</label>
                  <Input
                    name="validUntil"
                    type="date"
                    value={form.validUntil}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Terms</label>
                  <Textarea
                    name="terms"
                    value={form.terms}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Notes</label>
                  <Textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                  />
                </div>
                <div className="pt-2 flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => router.push(`/rfq-management/${id}`)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    Create Quote
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 