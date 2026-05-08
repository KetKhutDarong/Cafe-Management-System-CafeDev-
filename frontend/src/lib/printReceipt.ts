import { Order } from "../types";

export const printReceipt = (order: Order, storeName: string = "CafeDev") => {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    alert("Please allow popups to print.");
    return;
  }

  const itemsHtml = order.items.map(item => `
    <div style="display: flex; justify-between; margin-bottom: 4px;">
      <div style="flex: 1;">
        <strong>${item.quantity}x ${item.name || (item as any).menuItem?.name}</strong>
        ${item.selectedVariant ? `<div style="font-size: 10px; color: #666;">${item.selectedVariant.name}</div>` : ''}
        ${item.selectedModifiers && item.selectedModifiers.length > 0 ? 
          `<div style="font-size: 10px; color: #666;">+ ${item.selectedModifiers.map(m => m.name).join(', ')}</div>` : ''}
      </div>
      <div style="text-align: right;">$${((item.price || (item as any).menuItem?.price || 0) * item.quantity).toFixed(2)}</div>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${order.orderNumber || order.id}</title>
      <style>
        @media print {
          @page { margin: 0; }
          body { margin: 1cm; }
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          line-height: 1.2;
          font-size: 12px;
          color: #000;
          max-width: 300px;
          margin: 0 auto;
          padding: 20px;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        .header { margin-bottom: 20px; }
        .footer { margin-top: 30px; font-size: 10px; }
        .row { display: flex; justify-content: space-between; }
        .bold { font-weight: bold; }
        .total-row { font-size: 16px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="text-center header">
        <h2 style="margin: 0;">${storeName}</h2>
        <div style="font-size: 10px;">PROUDLY SERVING QUALITY COFFEE</div>
      </div>
      
      <div class="divider"></div>
      
      <div class="row">
        <span>Order #:</span>
        <span class="bold">${order.orderNumber || order.id.slice(-6)}</span>
      </div>
      <div class="row">
        <span>Date:</span>
        <span>${new Date(order.createdAt).toLocaleString()}</span>
      </div>
      <div class="row">
        <span>Customer:</span>
        <span class="bold">${order.customerName}</span>
      </div>
      <div class="row">
        <span>Type:</span>
        <span>${order.type} ${order.table ? `(Table ${order.table})` : ''}</span>
      </div>
      
      <div class="divider"></div>
      
      <div class="items">
        ${itemsHtml}
      </div>
      
      <div class="divider"></div>
      
      <div class="row">
        <span>Subtotal:</span>
        <span>$${(order.subtotal || 0).toFixed(2)}</span>
      </div>
      <div class="row">
        <span>Tax/Service:</span>
        <span>$${(order.tax || 0).toFixed(2)}</span>
      </div>
      <div class="row bold total-row">
        <span>TOTAL:</span>
        <span>$${(order.total || 0).toFixed(2)}</span>
      </div>
      
      <div class="divider"></div>
      
      <div class="row">
        <span>Payment:</span>
        <span>${order.paymentMethod}</span>
      </div>
      <div class="row">
        <span>Status:</span>
        <span>${order.paymentStatus}</span>
      </div>
      
      <div class="text-center footer">
        <div>THANK YOU FOR YOUR VISIT!</div>
        <div style="margin-top: 5px;">Follow us on Social Media</div>
        <div>@cafedev_official</div>
      </div>
      
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
