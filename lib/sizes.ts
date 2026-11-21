import raw from "@/data/pegasus-43-sizes.json";

export type StockStatus = "in_stock" | "low_stock" | "sold_out";

export type SizeOption = {
  sku: string;
  /** Label exactly as written in the data, e.g. "M 3.5 / W 5". */
  label: string;
  sizeUsMen: number;
  sizeUsWomen: number;
  sizeEu: string;
  displayOrder: number;
  stockQuantity: number;
  status: StockStatus;
};

export type Product = {
  styleCode: string;
  name: string;
  colorway: string;
  price: number;
  priceFormatted: string;
  launchDate: string;
  launchDateFormatted: string;
  sizes: SizeOption[];
};

/** At or below this many pairs, a size is shown as low stock. */
const LOW_STOCK_MAX = 5;

type RawRow = {
  sku: string;
  style_code: string;
  product_name: string;
  colorway: string;
  price: number;
  size_label: string;
  size_us_men: number;
  size_us_women: number;
  size_eu: string;
  display_order: number;
  in_stock: boolean;
  stock_quantity: number;
  stock_status: StockStatus;
  launch_date: string;
};

function deriveStatus(quantity: number): StockStatus {
  if (quantity <= 0) return "sold_out";
  if (quantity <= LOW_STOCK_MAX) return "low_stock";
  return "in_stock";
}

export function getProduct(): Product {
  const rows = (raw as RawRow[])
    .slice()
    .sort((a, b) => a.display_order - b.display_order);

  const first = rows[0];

  const sizes = rows.map<SizeOption>((row) => {
    const status = deriveStatus(row.stock_quantity);
    if (status !== row.stock_status) {
      console.warn(
        `[sizes] ${row.sku}: stock_status "${row.stock_status}" disagrees with quantity ${row.stock_quantity}; using "${status}".`,
      );
    }
    return {
      sku: row.sku,
      label: row.size_label,
      sizeUsMen: row.size_us_men,
      sizeUsWomen: row.size_us_women,
      sizeEu: row.size_eu,
      displayOrder: row.display_order,
      stockQuantity: row.stock_quantity,
      status,
    };
  });

  return {
    styleCode: first.style_code,
    name: first.product_name,
    colorway: first.colorway,
    price: first.price,
    priceFormatted: first.price.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    }),
    launchDate: first.launch_date,
    launchDateFormatted: new Date(`${first.launch_date}T00:00:00Z`).toLocaleDateString(
      "en-US",
      { timeZone: "UTC", dateStyle: "long" },
    ),
    sizes,
  };
}
