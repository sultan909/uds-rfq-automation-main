"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ExportTabProps {
  onExportToExcel: () => void;
}

export function ExportTab({ onExportToExcel }: ExportTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export RFQ</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={onExportToExcel}>
          Export RFQ Data
        </Button>
      </CardContent>
    </Card>
  );
}
