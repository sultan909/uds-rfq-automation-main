import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function UpdateSkuMappingDialog({
  open,
  onOpenChange,
  editMapping,
  setEditMapping,
  customers,
  customerOptions,
  customerDropdownOpen,
  setCustomerOptions,
  setCustomerDropdownOpen,
  removeVariationFromEdit,
  addVariationToEdit,
  handleCustomerSourceChange,
  handleCustomerOptionSelectUpdate,
  onUpdate,
  loading,
}: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  readOnly
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
                  readOnly
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
                          console.log('customers:', customers, 'customerOptions:', customerOptions, 'vIdx:', vIdx);
                          const filtered = customers.filter((c: any) =>
                            c.name && c.name.toLowerCase().includes(variation.source?.toLowerCase() || "")
                          );
                          const newOptions = [...customerOptions];
                          newOptions[vIdx] = filtered;
                          setCustomerOptions(newOptions);
                          setCustomerDropdownOpen(filtered.length > 0 || customers.length > 0 ? vIdx : null);
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
                              onMouseDown={() => handleCustomerOptionSelectUpdate(vIdx, c)}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onUpdate} disabled={loading}>
            Update Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 