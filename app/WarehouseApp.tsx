"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  location: string;
  supplier: string;
};

type Movement = {
  id: string;
  type: "entry" | "exit";
  productId: string;
  productName: string;
  quantity: number;
  date: string;
  note: string;
};

type View = "dashboard" | "inventory" | "movements" | "suppliers";

const INITIAL_PRODUCTS: Product[] = [
  { id: "p1", sku: "SKU-0241", name: "Taladro percutor 750W", category: "Herramientas", stock: 24, minStock: 8, unit: "uds.", location: "A-01-03", supplier: "FerreMax Perú" },
  { id: "p2", sku: "SKU-0188", name: "Guantes de nitrilo (caja)", category: "Seguridad", stock: 8, minStock: 12, unit: "cajas", location: "B-04-02", supplier: "Protección Andina" },
  { id: "p3", sku: "SKU-0312", name: "Cinta de embalaje 48 mm", category: "Embalaje", stock: 0, minStock: 18, unit: "rollos", location: "C-02-08", supplier: "Pack Sur" },
  { id: "p4", sku: "SKU-0097", name: "Casco de seguridad blanco", category: "Seguridad", stock: 42, minStock: 10, unit: "uds.", location: "B-01-04", supplier: "Protección Andina" },
  { id: "p5", sku: "SKU-0276", name: "Caja de cartón mediana", category: "Embalaje", stock: 156, minStock: 30, unit: "uds.", location: "C-06-01", supplier: "Pack Sur" },
  { id: "p6", sku: "SKU-0143", name: "Disco de corte 4½ pulgadas", category: "Herramientas", stock: 11, minStock: 15, unit: "uds.", location: "A-03-07", supplier: "FerreMax Perú" },
  { id: "p7", sku: "SKU-0351", name: "Film stretch industrial", category: "Embalaje", stock: 63, minStock: 20, unit: "rollos", location: "C-03-05", supplier: "Pack Sur" },
  { id: "p8", sku: "SKU-0064", name: "Lentes de protección", category: "Seguridad", stock: 6, minStock: 10, unit: "uds.", location: "B-02-06", supplier: "Protección Andina" },
];

const INITIAL_MOVEMENTS: Movement[] = [
  { id: "m1", type: "entry", productId: "p5", productName: "Caja de cartón mediana", quantity: 60, date: "2026-08-15T13:12:00-05:00", note: "Orden OC-1082" },
  { id: "m2", type: "exit", productId: "p1", productName: "Taladro percutor 750W", quantity: 2, date: "2026-08-15T11:46:00-05:00", note: "Despacho OP-445" },
  { id: "m3", type: "entry", productId: "p4", productName: "Casco de seguridad blanco", quantity: 20, date: "2026-08-15T10:20:00-05:00", note: "Reposición semanal" },
  { id: "m4", type: "exit", productId: "p2", productName: "Guantes de nitrilo (caja)", quantity: 4, date: "2026-08-15T09:08:00-05:00", note: "Área de operaciones" },
  { id: "m5", type: "exit", productId: "p3", productName: "Cinta de embalaje 48 mm", quantity: 6, date: "2026-08-14T16:34:00-05:00", note: "Despacho OP-440" },
];

const STORAGE_PRODUCTS = "almacen-nexo-products-v1";
const STORAGE_MOVEMENTS = "almacen-nexo-movements-v1";

function productStatus(product: Product) {
  if (product.stock === 0) return { key: "out", label: "Agotado" };
  if (product.stock <= product.minStock) return { key: "low", label: "Stock bajo" };
  return { key: "ok", label: "Disponible" };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function WarehouseApp() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [movements, setMovements] = useState<Movement[]>(INITIAL_MOVEMENTS);
  const [view, setView] = useState<View>("dashboard");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [stockFilter, setStockFilter] = useState("Todos");
  const [modal, setModal] = useState<"movement" | "product" | null>(null);
  const [toast, setToast] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem(STORAGE_PRODUCTS);
      const savedMovements = localStorage.getItem(STORAGE_MOVEMENTS);
      if (savedProducts) setProducts(JSON.parse(savedProducts));
      if (savedMovements) setMovements(JSON.parse(savedMovements));
    } catch {
      // If local storage is unavailable, the app remains fully usable in memory.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));
    localStorage.setItem(STORAGE_MOVEMENTS, JSON.stringify(movements));
  }, [products, movements, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const categories = useMemo(() => ["Todas", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const status = productStatus(product).label;
      const matchesText = !term || [product.name, product.sku, product.location, product.supplier].some((field) => field.toLowerCase().includes(term));
      return matchesText && (category === "Todas" || product.category === category) && (stockFilter === "Todos" || status === stockFilter);
    });
  }, [products, search, category, stockFilter]);

  const lowStock = products.filter((product) => product.stock > 0 && product.stock <= product.minStock).length;
  const outOfStock = products.filter((product) => product.stock === 0).length;
  const totalUnits = products.reduce((sum, product) => sum + product.stock, 0);
  const today = new Date().toISOString().slice(0, 10);
  const movementsToday = movements.filter((movement) => movement.date.slice(0, 10) === today).length;

  const showToast = (message: string) => setToast(message);

  function changeView(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const productId = String(data.get("productId"));
    const type = String(data.get("type")) as "entry" | "exit";
    const quantity = Number(data.get("quantity"));
    const note = String(data.get("note") || "Movimiento manual");
    const product = products.find((item) => item.id === productId);

    if (!product || !Number.isFinite(quantity) || quantity <= 0) {
      showToast("Revisa los datos del movimiento.");
      return;
    }
    if (type === "exit" && quantity > product.stock) {
      showToast(`Stock insuficiente: hay ${product.stock} ${product.unit}.`);
      return;
    }

    setProducts((current) => current.map((item) => item.id === productId ? { ...item, stock: item.stock + (type === "entry" ? quantity : -quantity) } : item));
    setMovements((current) => [{ id: `m-${Date.now()}`, type, productId, productName: product.name, quantity, date: new Date().toISOString(), note }, ...current]);
    setModal(null);
    showToast(type === "entry" ? "Entrada registrada correctamente." : "Salida registrada correctamente.");
  }

  function handleProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const sku = String(data.get("sku")).trim().toUpperCase();
    if (products.some((product) => product.sku.toLowerCase() === sku.toLowerCase())) {
      showToast("Ese SKU ya está registrado.");
      return;
    }
    const newProduct: Product = {
      id: `p-${Date.now()}`,
      sku,
      name: String(data.get("name")).trim(),
      category: String(data.get("category")).trim(),
      stock: Number(data.get("stock")),
      minStock: Number(data.get("minStock")),
      unit: String(data.get("unit")).trim(),
      location: String(data.get("location")).trim().toUpperCase(),
      supplier: String(data.get("supplier")).trim(),
    };
    setProducts((current) => [newProduct, ...current]);
    setModal(null);
    showToast("Producto agregado al inventario.");
  }

  function exportInventory() {
    const rows = [["SKU", "Producto", "Categoría", "Stock", "Unidad", "Stock mínimo", "Ubicación", "Proveedor"], ...filteredProducts.map((p) => [p.sku, p.name, p.category, p.stock, p.unit, p.minStock, p.location, p.supplier])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "inventario-almacen-nexo.csv";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Inventario exportado.");
  }

  const viewTitles: Record<View, { eyebrow: string; title: string }> = {
    dashboard: { eyebrow: "Panel / Resumen", title: "Buenos días, Mariana" },
    inventory: { eyebrow: "Operaciones / Inventario", title: "Control de inventario" },
    movements: { eyebrow: "Operaciones / Movimientos", title: "Entradas y salidas" },
    suppliers: { eyebrow: "Red / Proveedores", title: "Proveedores" },
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => changeView("dashboard")}><span className="brand-mark">A</span><span>Almacén <b>Nexo</b></span></button>
        <nav className="nav-list" aria-label="Navegación principal">
          <button className={`nav-item ${view === "dashboard" ? "active" : ""}`} onClick={() => changeView("dashboard")}><span>▦</span> Panel general</button>
          <button className={`nav-item ${view === "inventory" ? "active" : ""}`} onClick={() => changeView("inventory")}><span>□</span> Inventario <em>{products.length}</em></button>
          <button className={`nav-item ${view === "movements" ? "active" : ""}`} onClick={() => changeView("movements")}><span>↔</span> Movimientos</button>
          <button className={`nav-item ${view === "suppliers" ? "active" : ""}`} onClick={() => changeView("suppliers")}><span>◇</span> Proveedores</button>
        </nav>
        <div className="sidebar-rule" />
        <button className="nav-item secondary" onClick={() => showToast("La ayuda contextual estará disponible pronto.")}><span>?</span> Centro de ayuda</button>
        <div className="warehouse-card">
          <span className="eyebrow">ALMACÉN ACTIVO</span>
          <strong>Principal · Lima</strong>
          <small><i /> Operación normal · sincronizado</small>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p className="breadcrumb">{viewTitles[view].eyebrow}</p><h1>{viewTitles[view].title}</h1></div>
          <div className="header-actions">
            <button className="icon-button" aria-label="Notificaciones" onClick={() => showToast(`${lowStock + outOfStock} alertas de stock pendientes`)}>●</button>
            <button className="primary-button" onClick={() => setModal("movement")}>＋ Nuevo movimiento</button>
            <span className="avatar" title="Mariana Rojas">MR</span>
          </div>
        </header>

        <div className="content">
          {view === "dashboard" && (
            <>
              <section className="metrics" aria-label="Resumen del almacén">
                <article className="metric-card accent"><span className="metric-icon">▦</span><div><p>Productos registrados</p><strong>{products.length}</strong><small><b>{totalUnits.toLocaleString("es-PE")}</b> unidades disponibles</small></div></article>
                <article className="metric-card"><span className="metric-icon amber">!</span><div><p>Stock bajo</p><strong>{lowStock}</strong><small>Requieren atención</small></div></article>
                <article className="metric-card"><span className="metric-icon red">×</span><div><p>Agotados</p><strong>{outOfStock}</strong><small>Sin existencias</small></div></article>
                <article className="metric-card"><span className="metric-icon blue">↔</span><div><p>Movimientos hoy</p><strong>{movementsToday}</strong><small><b>{movements.filter((m) => m.date.slice(0, 10) === today && m.type === "entry").length} entradas</b> · {movements.filter((m) => m.date.slice(0, 10) === today && m.type === "exit").length} salidas</small></div></article>
              </section>

              <div className="dashboard-grid">
                <InventoryTable products={products.slice(0, 5)} title="Inventario reciente" description="Existencias con actualización inmediata." onViewAll={() => changeView("inventory")} />
                <aside className="activity-panel">
                  <div className="section-heading compact"><div><h2>Actividad reciente</h2><p>Últimos movimientos registrados.</p></div></div>
                  <div className="activity-list">
                    {movements.slice(0, 5).map((movement) => <MovementItem key={movement.id} movement={movement} />)}
                  </div>
                  <button className="full-link" onClick={() => changeView("movements")}>Ver todos los movimientos →</button>
                </aside>
              </div>
            </>
          )}

          {view === "inventory" && (
            <section className="inventory-panel expanded">
              <div className="section-heading">
                <div><h2>Inventario general</h2><p>{filteredProducts.length} de {products.length} productos visibles.</p></div>
                <div className="section-actions"><button className="ghost-button bordered" onClick={exportInventory}>↓ Exportar CSV</button><button className="primary-button" onClick={() => setModal("product")}>＋ Agregar producto</button></div>
              </div>
              <div className="table-toolbar wrap">
                <label className="search-field"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Buscar producto" placeholder="Producto, SKU, ubicación o proveedor..." /></label>
                <label className="select-field"><span>Categoría</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label className="select-field"><span>Estado</span><select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}><option>Todos</option><option>Disponible</option><option>Stock bajo</option><option>Agotado</option></select></label>
                {(search || category !== "Todas" || stockFilter !== "Todos") && <button className="clear-button" onClick={() => { setSearch(""); setCategory("Todas"); setStockFilter("Todos"); }}>Limpiar</button>}
              </div>
              <InventoryRows products={filteredProducts} />
            </section>
          )}

          {view === "movements" && (
            <section className="movement-layout">
              <div className="movement-summary">
                <article><span className="movement-symbol in">↓</span><div><small>Entradas registradas</small><strong>{movements.filter((m) => m.type === "entry").length}</strong></div></article>
                <article><span className="movement-symbol out">↑</span><div><small>Salidas registradas</small><strong>{movements.filter((m) => m.type === "exit").length}</strong></div></article>
                <article><span className="movement-symbol neutral">≡</span><div><small>Total de movimientos</small><strong>{movements.length}</strong></div></article>
              </div>
              <div className="inventory-panel">
                <div className="section-heading"><div><h2>Historial de movimientos</h2><p>Trazabilidad de entradas y salidas del almacén.</p></div><button className="primary-button" onClick={() => setModal("movement")}>＋ Registrar</button></div>
                <div className="movement-history">{movements.map((movement) => <MovementItem key={movement.id} movement={movement} detailed />)}</div>
              </div>
            </section>
          )}

          {view === "suppliers" && (
            <section>
              <div className="supplier-intro"><div><span className="eyebrow">RED DE ABASTECIMIENTO</span><h2>Socios que mantienen el almacén en marcha</h2><p>Resumen de proveedores y productos asociados al inventario actual.</p></div><span className="supplier-count">{new Set(products.map((p) => p.supplier)).size}<small>proveedores activos</small></span></div>
              <div className="supplier-grid">
                {Array.from(new Set(products.map((p) => p.supplier))).map((supplier, index) => {
                  const supplied = products.filter((p) => p.supplier === supplier);
                  return <article className="supplier-card" key={supplier}><span className={`supplier-avatar tone-${index % 3}`}>{supplier.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span><div><h3>{supplier}</h3><p>{supplied.map((p) => p.category).filter((item, position, all) => all.indexOf(item) === position).join(" · ")}</p></div><dl><div><dt>Productos</dt><dd>{supplied.length}</dd></div><div><dt>Unidades</dt><dd>{supplied.reduce((sum, p) => sum + p.stock, 0)}</dd></div></dl><button onClick={() => { setSearch(supplier); setView("inventory"); }}>Ver productos →</button></article>;
                })}
              </div>
            </section>
          )}
        </div>
      </section>

      {modal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setModal(null); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className="modal-close" aria-label="Cerrar" onClick={() => setModal(null)}>×</button>
            {modal === "movement" ? (
              <form onSubmit={handleMovement}>
                <div className="modal-heading"><span className="modal-icon">↔</span><div><h2 id="modal-title">Registrar movimiento</h2><p>Actualiza las existencias del almacén.</p></div></div>
                <label className="form-field"><span>Producto</span><select name="productId" required>{products.map((product) => <option key={product.id} value={product.id}>{product.sku} · {product.name} ({product.stock} {product.unit})</option>)}</select></label>
                <div className="form-row"><label className="form-field"><span>Tipo</span><select name="type"><option value="entry">Entrada</option><option value="exit">Salida</option></select></label><label className="form-field"><span>Cantidad</span><input name="quantity" type="number" min="1" step="1" required placeholder="0" /></label></div>
                <label className="form-field"><span>Referencia o nota</span><input name="note" placeholder="Ej. Orden OC-1083" /></label>
                <div className="modal-actions"><button type="button" className="ghost-button bordered" onClick={() => setModal(null)}>Cancelar</button><button className="primary-button" type="submit">Guardar movimiento</button></div>
              </form>
            ) : (
              <form onSubmit={handleProduct}>
                <div className="modal-heading"><span className="modal-icon">□</span><div><h2 id="modal-title">Agregar producto</h2><p>Crea un nuevo registro de inventario.</p></div></div>
                <label className="form-field"><span>Nombre del producto</span><input name="name" required placeholder="Ej. Mascarilla de protección" /></label>
                <div className="form-row"><label className="form-field"><span>SKU</span><input name="sku" required placeholder="SKU-0000" /></label><label className="form-field"><span>Categoría</span><input name="category" required placeholder="Seguridad" /></label></div>
                <div className="form-row triple"><label className="form-field"><span>Stock inicial</span><input name="stock" type="number" min="0" defaultValue="0" required /></label><label className="form-field"><span>Stock mínimo</span><input name="minStock" type="number" min="0" defaultValue="5" required /></label><label className="form-field"><span>Unidad</span><input name="unit" required defaultValue="uds." /></label></div>
                <div className="form-row"><label className="form-field"><span>Ubicación</span><input name="location" required placeholder="A-01-01" /></label><label className="form-field"><span>Proveedor</span><input name="supplier" required placeholder="Nombre del proveedor" /></label></div>
                <div className="modal-actions"><button type="button" className="ghost-button bordered" onClick={() => setModal(null)}>Cancelar</button><button className="primary-button" type="submit">Agregar producto</button></div>
              </form>
            )}
          </section>
        </div>
      )}
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </main>
  );
}

function InventoryTable({ products, title, description, onViewAll }: { products: Product[]; title: string; description: string; onViewAll: () => void }) {
  return <section className="inventory-panel"><div className="section-heading"><div><h2>{title}</h2><p>{description}</p></div><button className="ghost-button" onClick={onViewAll}>Ver inventario completo →</button></div><InventoryRows products={products} compact /></section>;
}

function InventoryRows({ products, compact = false }: { products: Product[]; compact?: boolean }) {
  if (products.length === 0) return <div className="empty-state"><span>⌕</span><h3>No encontramos productos</h3><p>Prueba con otros filtros o agrega un producto nuevo.</p></div>;
  return <div className="table-wrap"><table><thead><tr><th>PRODUCTO</th><th>CATEGORÍA</th><th>UBICACIÓN</th><th>STOCK</th><th>ESTADO</th>{!compact && <th>PROVEEDOR</th>}</tr></thead><tbody>{products.map((product) => { const status = productStatus(product); return <tr key={product.id}><td><div className="product-cell"><span className="product-thumb">□</span><div><strong>{product.name}</strong><small>{product.sku}</small></div></div></td><td>{product.category}</td><td><span className="location-chip">{product.location}</span></td><td><b className="stock-number">{product.stock}</b> {product.unit}</td><td><span className={`status ${status.key}`}>{status.label}</span></td>{!compact && <td>{product.supplier}</td>}</tr>; })}</tbody></table></div>;
}

function MovementItem({ movement, detailed = false }: { movement: Movement; detailed?: boolean }) {
  return <article className={`movement-item ${detailed ? "detailed" : ""}`}><span className={`movement-symbol ${movement.type === "entry" ? "in" : "out"}`}>{movement.type === "entry" ? "↓" : "↑"}</span><div className="movement-copy"><strong>{movement.productName}</strong><small>{movement.note}</small></div><div className="movement-meta"><strong className={movement.type === "entry" ? "positive" : "negative"}>{movement.type === "entry" ? "+" : "−"}{movement.quantity}</strong><small>{formatDate(movement.date)}</small></div></article>;
}
