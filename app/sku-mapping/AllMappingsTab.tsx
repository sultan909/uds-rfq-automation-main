import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";

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
    handleDeleteMapping,
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
            sku: v.sku,
            source: v.source,
            customerId: v.customerId || 1
          })),
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
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Edit SKU Mapping</DialogTitle>
                        <DialogDescription>
                          Update the mapping between a standard SKU and its variations.
                        </DialogDescription>
                      </DialogHeader>
                      {editMapping && (
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-standard-sku">Standard SKU</Label>
                              <Input
                                id="edit-standard-sku"
                                value={editMapping.standardSku}
                                onChange={(e) =>
                                  setEditMapping({ ...editMapping, standardSku: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-standard-description">Description</Label>
                              <Input
                                id="edit-standard-description"
                                value={editMapping.standardDescription}
                                onChange={(e) =>
                                  setEditMapping({
                                    ...editMapping,
                                    standardDescription: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>

                          <div>
                            <Label>SKU Variations</Label>
                            <div className="space-y-2 mt-2">
                              {editMapping.variations.map((variation: any, vIdx: number) => (
                                <div key={variation.id ?? vIdx} className="flex gap-2">
                                  <div className="relative w-2/5">
                                    <Input
                                      value={variation.variationSku}
                                      onChange={(e) => {
                                        const updatedVariations = [...editMapping.variations]
                                        updatedVariations[vIdx].sku = e.target.value
                                        setEditMapping({ ...editMapping, variations: updatedVariations })
                                      }}
                                      placeholder="Variation SKU"
                                      className="flex-1 min-w-0"
                                    />
                                  </div>
                                  <div className="relative w-3/5">
                                    <Input
                                      value={variation.customerName}
                                      onChange={(e) => handleCustomerSourceChange(vIdx, e.target.value)}
                                      onFocus={() => {
                                        const filtered = customers.filter((c: any) =>
                                          c.name && c.name.toLowerCase().includes(variation.source?.toLowerCase() || "")
                                        );
                                        const newOptions = [...customerOptions];
                                        newOptions[vIdx] = filtered;
                                        setCustomerOptions(newOptions);
                                        setCustomerDropdownOpen(filtered.length > 0 ? vIdx : null);
                                      }}
                                      onBlur={() => {
                                        setTimeout(() => setCustomerDropdownOpen(null), 100);
                                      }}
                                      placeholder="Source (e.g. Customer)"
                                      className="flex-1 min-w-0"
                                      autoComplete="off"
                                    />
                                    {customerDropdownOpen === vIdx && customerOptions[vIdx]?.length > 0 && (
                                      <div className="absolute left-0 top-full z-10 bg-white border rounded shadow w-full max-h-48 overflow-auto" style={{overflow: 'auto', width: '100%'}}>
                                        {customerOptions[vIdx].map((c: any) => (
                                          <div
                                            key={c.id}
                                            className="px-3 py-2 cursor-pointer hover:bg-muted"
                                            onMouseDown={() => props.handleCustomerOptionSelect(vIdx, c)}
                                          >
                                            <div className="font-medium">{c.name}</div>
                                            <div className="text-xs text-muted-foreground">{c.email}</div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeVariationFromEdit(variation.id)}
                                    disabled={editMapping.variations.length === 1}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={addVariationToEdit}
                                className="mt-2"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Variation
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleUpdateMapping}>Update Mapping</Button>
                      </DialogFooter>
                    </DialogContent>
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