"use client"

import { TabsContent } from "@/components/ui/tabs"
import EmailParser from "@/components/email-parser"

export default function EmailParserPage() {
  return (
    <TabsContent value="email" forceMount>
      <EmailParser />
    </TabsContent>
  )
}