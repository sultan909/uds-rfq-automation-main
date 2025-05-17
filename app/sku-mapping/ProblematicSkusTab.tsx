import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check } from "lucide-react";

export default function ProblematicSkusTab(props: any) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Problematic SKU</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Suggested Mapping</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">HP-26X-TONER</TableCell>
            <TableCell>New Customer Inc.</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span>CF226X (HP 26X High Yield Black Toner)</span>
                <Badge variant="outline" className="bg-green-50">
                  98% Match
                </Badge>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  <Check className="mr-2 h-4 w-4" />
                  Accept
                </Button>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">HP55-X-BLK</TableCell>
            <TableCell>Office Supplies Ltd.</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span>CE255X (HP 55X High Yield Black Toner)</span>
                <Badge variant="outline" className="bg-green-50">
                  95% Match
                </Badge>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  <Check className="mr-2 h-4 w-4" />
                  Accept
                </Button>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
} 