// Test component to verify PrimeReact integration
import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

interface TestItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

const testData: TestItem[] = [
  { id: 1, name: 'Test Item 1', quantity: 10, price: 25.99 },
  { id: 2, name: 'Test Item 2', quantity: 5, price: 49.99 },
];

export function PrimeReactTest() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">PrimeReact DataTable Test</h2>
      <DataTable value={testData} tableStyle={{ minWidth: '50rem' }}>
        <Column field="id" header="ID" />
        <Column field="name" header="Name" />
        <Column field="quantity" header="Quantity" />
        <Column field="price" header="Price" />
      </DataTable>
    </div>
  );
}