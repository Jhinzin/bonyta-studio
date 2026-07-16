import React, { useMemo, useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useServices } from '../hooks/useServices'

const emptyService = { name: '', duration_minutes: 120, price: '', material_cost: '' }
const emptyProduct = { name: '', price: '', cost: '', stock_quantity: 0 }

const moneyToNumber = (value) => Number.parseFloat(String(value || '0').replace(',', '.')) || 0

const formatCurrency = (value) => (
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
)

const formatDuration = (minutes) => {
  const value = Number(minutes || 0)
  const hours = Math.floor(value / 60)
  const rest = value % 60
  if (!hours) return `${rest} min`
  return `${hours}h${rest ? ` ${rest}m` : ''}`
}

export default function ServicesView({ theme }) {
  const { services, isLoading: loadingServices, createService, updateService, deleteService } = useServices()
  const { products, isLoading: loadingProducts, error: productsError, createProduct, updateProduct, deleteProduct } = useProducts()
  const [mode, setMode] = useState('services')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [serviceForm, setServiceForm] = useState(emptyService)
  const [productForm, setProductForm] = useState(emptyProduct)
  const [query, setQuery] = useState('')

  const isLight = theme === 'light'
  const bgMain = isLight ? '#f5f5f5' : '#121212'
  const bgCard = isLight ? '#ffffff' : '#2a2a2a'
  const bgInput = isLight ? '#ffffff' : '#222'
  const textMain = isLight ? '#333' : '#fff'
  const textSec = isLight ? '#666' : '#ccc'
  const borderCol = isLight ? '#ddd' : '#333'

  const inputStyle = {
    width: '100%',
    padding: '13px',
    borderRadius: '8px',
    border: `1px solid ${borderCol}`,
    background: bgInput,
    color: textMain,
    outline: 'none',
    fontSize: '0.95rem'
  }

  const filteredServices = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return services
    return services.filter((service) => String(service.name || '').toLowerCase().includes(needle))
  }, [services, query])

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return products
    return products.filter((product) => String(product.name || '').toLowerCase().includes(needle))
  }, [products, query])

  const openServiceModal = (service = null) => {
    setMode('services')
    setEditingItem(service)
    setServiceForm(service ? {
      name: service.name || '',
      duration_minutes: service.duration_minutes || 60,
      price: service.price ?? '',
      material_cost: service.material_cost ?? ''
    } : emptyService)
    setIsModalOpen(true)
  }

  const openProductModal = (product = null) => {
    setMode('products')
    setEditingItem(product)
    setProductForm(product ? {
      name: product.name || '',
      price: product.price ?? '',
      cost: product.cost ?? '',
      stock_quantity: product.stock_quantity ?? 0
    } : emptyProduct)
    setIsModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (mode === 'services') {
      const payload = {
        name: serviceForm.name,
        duration_minutes: Number.parseInt(serviceForm.duration_minutes, 10),
        price: moneyToNumber(serviceForm.price),
        material_cost: moneyToNumber(serviceForm.material_cost)
      }
      const result = editingItem ? await updateService(editingItem.id, payload) : await createService(payload)
      if (!result.success) return alert(result.error)
    } else {
      const payload = {
        name: productForm.name,
        price: moneyToNumber(productForm.price),
        cost: moneyToNumber(productForm.cost),
        stock_quantity: Number.parseInt(productForm.stock_quantity, 10) || 0
      }
      const result = editingItem ? await updateProduct(editingItem.id, payload) : await createProduct(payload)
      if (!result.success) return alert(result.error)
    }

    setIsModalOpen(false)
  }

  const handleDelete = async () => {
    if (!editingItem) return
    if (!window.confirm('Excluir este item?')) return

    const result = mode === 'services'
      ? await deleteService(editingItem.id)
      : await deleteProduct(editingItem.id)

    if (!result.success) return alert(result.error)
    setIsModalOpen(false)
  }

  const loading = mode === 'services' ? loadingServices : loadingProducts
  const emptyMessage = mode === 'services' ? 'Nenhum servico cadastrado.' : 'Nenhum produto cadastrado.'
  const visibleItems = mode === 'services' ? filteredServices : filteredProducts

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: textMain, margin: 0 }}>Catalogo</h2>
          <p style={{ color: textSec, fontSize: '0.82rem', marginTop: '4px' }}>Servicos, produtos e extras da comanda</p>
        </div>
        <button
          onClick={() => mode === 'services' ? openServiceModal() : openProductModal()}
          style={{ background: 'var(--primary-color, #e91e63)', color: '#fff', padding: '11px 14px', borderRadius: '8px', border: 'none', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <i className="fa-solid fa-plus" style={{ marginRight: '8px' }}></i> Novo
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '12px', padding: '4px', marginBottom: '14px' }}>
        {[
          { id: 'services', label: 'Servicos', icon: 'fa-list-check' },
          { id: 'products', label: 'Produtos', icon: 'fa-boxes-stacked' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setMode(tab.id); setQuery('') }}
            style={{ border: 'none', borderRadius: '9px', background: mode === tab.id ? 'var(--primary-color, #e91e63)' : 'transparent', color: mode === tab.id ? '#fff' : textSec, padding: '11px', fontWeight: 900, cursor: 'pointer' }}
          >
            <i className={`fa-solid ${tab.icon}`} style={{ marginRight: '7px' }}></i>{tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
        <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '10px', padding: '10px' }}>
          <div style={{ color: textSec, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>{mode === 'services' ? 'Servicos' : 'Produtos'}</div>
          <strong style={{ color: textMain, fontSize: '1.1rem' }}>{mode === 'services' ? services.length : products.length}</strong>
        </div>
        <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '10px', padding: '10px' }}>
          <div style={{ color: textSec, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>{mode === 'services' ? 'Ticket medio' : 'Em estoque'}</div>
          <strong style={{ color: textMain, fontSize: '1.1rem' }}>
            {mode === 'services'
              ? formatCurrency(services.reduce((sum, service) => sum + Number(service.price || 0), 0) / Math.max(services.length, 1))
              : products.reduce((sum, product) => sum + Number(product.stock_quantity || 0), 0)}
          </strong>
        </div>
        <div style={{ background: bgCard, border: `1px solid ${borderCol}`, borderRadius: '10px', padding: '10px' }}>
          <div style={{ color: textSec, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>CMV medio</div>
          <strong style={{ color: textMain, fontSize: '1.1rem' }}>
            {mode === 'services'
              ? formatCurrency(services.reduce((sum, service) => sum + Number(service.material_cost || 0), 0) / Math.max(services.length, 1))
              : formatCurrency(products.reduce((sum, product) => sum + Number(product.cost || 0), 0) / Math.max(products.length, 1))}
          </strong>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: textSec }}></i>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={mode === 'services' ? 'Buscar servico...' : 'Buscar produto...'}
          style={{ ...inputStyle, paddingLeft: '40px' }}
        />
      </div>

      {productsError && mode === 'products' && (
        <div style={{ marginBottom: '12px', background: 'rgba(239,68,68,.14)', color: '#ff9a9a', padding: '12px', borderRadius: '10px', fontSize: '0.84rem' }}>
          Produtos ainda nao carregaram. Rode a migration de produtos no Supabase.
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: textSec }}>Carregando...</div>
      ) : visibleItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: bgCard, borderRadius: '12px', border: `1px dashed ${borderCol}` }}>
          <i className={`fa-solid ${mode === 'services' ? 'fa-sparkles' : 'fa-box-open'}`} style={{ fontSize: '2.4rem', color: textSec, marginBottom: '14px' }}></i>
          <p style={{ color: textSec }}>{emptyMessage}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {mode === 'services' ? filteredServices.map((service) => (
            <button
              type="button"
              key={service.id}
              onClick={() => openServiceModal(service)}
              style={{ background: bgCard, padding: '14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: `1px solid ${borderCol}`, borderLeft: '4px solid var(--primary-color, #e91e63)', textAlign: 'left', gap: '12px' }}
            >
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: '1.04rem', fontWeight: 900, margin: 0, color: textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{service.name}</h3>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', color: textSec, marginTop: '5px', flexWrap: 'wrap' }}>
                  <span><i className="fa-regular fa-clock"></i> {formatDuration(service.duration_minutes)}</span>
                  <span><i className="fa-solid fa-box-open"></i> CMV {formatCurrency(service.material_cost)}</span>
                </div>
              </div>
              <strong style={{ fontSize: '1.08rem', color: textMain, whiteSpace: 'nowrap' }}>{formatCurrency(service.price)}</strong>
            </button>
          )) : filteredProducts.map((product) => (
            <button
              type="button"
              key={product.id}
              onClick={() => openProductModal(product)}
              style={{ background: bgCard, padding: '14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: `1px solid ${borderCol}`, borderLeft: Number(product.stock_quantity || 0) <= 2 ? '4px solid #f59e0b' : '4px solid #10b981', textAlign: 'left', gap: '12px' }}
            >
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: '1.04rem', fontWeight: 900, margin: 0, color: textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</h3>
                <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', color: textSec, marginTop: '5px', flexWrap: 'wrap' }}>
                  <span><i className="fa-solid fa-cubes-stacked"></i> Estoque {product.stock_quantity || 0}</span>
                  <span><i className="fa-solid fa-box-open"></i> Custo {formatCurrency(product.cost)}</span>
                </div>
              </div>
              <strong style={{ fontSize: '1.08rem', color: textMain, whiteSpace: 'nowrap' }}>{formatCurrency(product.price)}</strong>
            </button>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', zIndex: 99999 }}>
          <div style={{ background: bgMain, width: '100%', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: textMain, margin: 0 }}>
                  {editingItem ? 'Editar' : 'Novo'} {mode === 'services' ? 'servico' : 'produto'}
                </h3>
                <p style={{ color: textSec, fontSize: '0.78rem', marginTop: '4px' }}>
                  {mode === 'services' ? 'Preco, duracao e custo do procedimento' : 'Produto, extra ou item vendido na comanda'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ width: '38px', height: '38px', borderRadius: '50%', border: `1px solid ${borderCol}`, background: bgCard, color: textMain, cursor: 'pointer' }}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '18px 20px 28px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
              {mode === 'services' ? (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.84rem', color: textSec }}>Nome do servico</label>
                    <input type="text" required value={serviceForm.name} onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.84rem', color: textSec }}>Duracao em minutos</label>
                    <input type="number" required min="1" value={serviceForm.duration_minutes} onChange={(event) => setServiceForm({ ...serviceForm, duration_minutes: event.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.84rem', color: textSec }}>Valor</label>
                      <input type="number" required min="0" step="0.01" value={serviceForm.price} onChange={(event) => setServiceForm({ ...serviceForm, price: event.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.84rem', color: textSec }}>Custo material</label>
                      <input type="number" required min="0" step="0.01" value={serviceForm.material_cost} onChange={(event) => setServiceForm({ ...serviceForm, material_cost: event.target.value })} style={inputStyle} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.84rem', color: textSec }}>Nome do produto ou extra</label>
                    <input type="text" required value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.84rem', color: textSec }}>Valor venda</label>
                      <input type="number" required min="0" step="0.01" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.84rem', color: textSec }}>Custo</label>
                      <input type="number" required min="0" step="0.01" value={productForm.cost} onChange={(event) => setProductForm({ ...productForm, cost: event.target.value })} style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.84rem', color: textSec }}>Quantidade em estoque</label>
                    <input type="number" required min="0" value={productForm.stock_quantity} onChange={(event) => setProductForm({ ...productForm, stock_quantity: event.target.value })} style={inputStyle} />
                  </div>
                </>
              )}

              <button type="submit" style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', background: 'var(--primary-color, #e91e63)', color: '#fff', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', marginTop: '8px' }}>
                Salvar
              </button>

              {editingItem && (
                <button type="button" onClick={handleDelete} style={{ width: '100%', padding: '13px', borderRadius: '8px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: 900, cursor: 'pointer' }}>
                  Excluir
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
