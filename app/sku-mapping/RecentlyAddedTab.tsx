import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function RecentlyAddedTab(props: any) {
  const {
    mappings,
    isEditDialogOpen,
    editMapping,
    setEditMapping,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    mappingToDelete,
    setMappingToDelete,
    setIsDeleteDialogOpen,
    handleCustomerSourceChange,
    customerOptions,
    customerDropdownOpen,
    setCustomerOptions,
    setCustomerDropdownOpen,
    customers,
    removeVariationFromEdit,
    addVariationToEdit,
    setMappings,
    handleDeleteMapping,
  } = props;

  let recentMappings = [...mappings];
  if (recentMappings.length > 0) {
    if (recentMappings[0]?.createdAt) {
      recentMappings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      recentMappings = recentMappings.slice(0, 10);
    } else {
      recentMappings = recentMappings.slice(-10).reverse();
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Standard SKU</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Variations</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentMappings.length > 0 ? recentMappings.map((mapping: any) => (
            <TableRow key={mapping.id}>
              <TableCell className="font-medium">{mapping.standardSku}</TableCell>
              <TableCell>{mapping.standardDescription}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {mapping.variations.map((variation: any) => (
                    <Badge key={variation.id} variant="outline" className="flex items-center gap-1">
                      {variation.variationSku}
                      <span className="text-xs text-muted-foreground">({variation.customerName})</span>
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Dialog
                    open={isEditDialogOpen && editMapping?.id === mapping.id}
                    onOpenChange={(open) => {
                      if (open) {
                        setEditMapping(mapping)
                      }
                      setIsEditDialogOpen(open)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    {/* You may want to move the full edit dialog content here, or keep it in the main page and pass as a prop */}
                  </Dialog>
                  <Dialog
                    open={isDeleteDialogOpen && mappingToDelete === mapping.id}
                    onOpenChange={(open) => {
                      if (open) {
                        setMappingToDelete(mapping.id)
                      }
                      setIsDeleteDialogOpen(open)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete SKU Mapping</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this SKU mapping? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteMapping}>
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                No recent mappings found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 