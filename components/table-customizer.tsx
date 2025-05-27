import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

interface Column {
  id: string;
  label: string;
}

interface TableCustomizerProps {
  columns: Column[];
  visibleColumns: string[];
  onColumnToggle: (columnId: string) => void;
}

export function TableCustomizer({ columns, visibleColumns, onColumnToggle }: TableCustomizerProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Customize Table
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Customize Table Columns</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {columns.map((column) => (
            <div key={column.id} className="flex items-center space-x-2">
              <Checkbox
                id={column.id}
                checked={visibleColumns.includes(column.id)}
                onCheckedChange={() => onColumnToggle(column.id)}
              />
              <Label htmlFor={column.id}>{column.label}</Label>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 