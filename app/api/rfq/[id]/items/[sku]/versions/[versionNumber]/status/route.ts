import { NextRequest, NextResponse } from 'next/server';
import { RfqService } from '../../../../../../../lib/mock-db/service';

export async function PUT(request: NextRequest, { params }: { params: { id: string, sku: string, versionNumber: string } }) {
  const { id, sku, versionNumber } = params;
  const { status } = await request.json();
  const rfq = RfqService.getById(id);
  if (!rfq) {
    return NextResponse.json({ success: false, error: 'RFQ not found' }, { status: 404 });
  }
  const item = rfq.items.find((i: any) => i.sku === sku);
  if (!item || !item.versions) {
    return NextResponse.json({ success: false, error: 'SKU or versions not found' }, { status: 404 });
  }
  const version = item.versions.find((v: any) => v.versionNumber === Number(versionNumber));
  if (!version) {
    return NextResponse.json({ success: false, error: 'Version not found' }, { status: 404 });
  }
  version.status = status;
  version.updatedAt = new Date().toISOString();
  RfqService.update(id, { items: rfq.items });
  return NextResponse.json({ success: true, data: version });
} 