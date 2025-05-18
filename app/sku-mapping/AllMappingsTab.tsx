import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import UpdateSkuMappingDialog from "./UpdateSkuMappingDialog";

export default function AllMappingsTab(props: any) {
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
    handleCustomerOptionSelectUpdate,
    // handleCustomerOptionSelect,
  } = props;

  // Helper for updating mapping
  const handleUpdateMapping = async () => {
    if (!editMapping) return;
    try {
        
        await fetch(`/api/sku-mapping/${editMapping.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          standardSku: editMapping.standardSku,
          standardDescription: editMapping.standardDescription,
          variations: editMapping.variations.map((v: any) => ({
            ...(v.id ? { id: v.id } : {}),
            variationSku: v.variationSku || v.sku,
            source: v.source,
            customerId: v.customerId || 1,
            ...(v.id ? {} : { isNew: true })
          })),
          replacementMode: true
        }),
      });
      // Refresh mappings from backend
      const fetchRes = await fetch("/api/sku-mapping");
      const data = await fetchRes.json();
      setMappings(data.data || []);
      setIsEditDialogOpen(false);
      setEditMapping(null);
    } catch (err) {
      alert("Failed to update SKU mapping");
    }
  };

  // Helper for deleting mapping
  const handleDeleteMapping = async () => {
    if (mappingToDelete === null) return;
    try {
      await fetch(`/api/sku-mapping/${mappingToDelete}`, { method: "DELETE" });
      // Refresh mappings from backend
      const fetchRes = await fetch("/api/sku-mapping");
      const data = await fetchRes.json();
      setMappings(data.data || []);
      setIsDeleteDialogOpen(false);
      setMappingToDelete(null);
    } catch (err) {
      alert("Failed to delete SKU mapping");
    }
  };

  // Handle customer selection in the dialog
//   const handleCustomerOptionSelect = (vIdx: number, customer: any) => {
//     const updatedVariations = [...editMapping.variations];
//     updatedVariations[vIdx] = {
//       ...updatedVariations[vIdx],
//       customerName: customer.name,
//       customerId: customer.id,
//       source: customer.name,
//     };
//     setEditMapping({ ...editMapping, variations: updatedVariations });
//   };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">
              <div className="flex items-center gap-1">
                Standard SKU
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                Description
              </div>
            </TableHead>
            <TableHead>Variations</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mappings.map((mapping: any) => (
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
                    <UpdateSkuMappingDialog
                      open={isEditDialogOpen && editMapping?.id === mapping.id}
                      onOpenChange={setIsEditDialogOpen}
                      editMapping={editMapping}
                      setEditMapping={setEditMapping}
                      customers={customers}
                      customerOptions={customerOptions}
                      customerDropdownOpen={customerDropdownOpen}
                      setCustomerOptions={setCustomerOptions}
                      setCustomerDropdownOpen={setCustomerDropdownOpen}
                      removeVariationFromEdit={removeVariationFromEdit}
                      addVariationToEdit={addVariationToEdit}
                      handleCustomerSourceChange={handleCustomerSourceChange}
                      handleCustomerOptionSelectUpdate={handleCustomerOptionSelectUpdate}
                      onUpdate={handleUpdateMapping}
                      loading={false}
                    />
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 