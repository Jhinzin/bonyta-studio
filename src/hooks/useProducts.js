import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useProducts() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true })

      if (fetchError) throw fetchError
      setProducts(data || [])
      setError(null)
    } catch (err) {
      setProducts([])
      setError(err.message)
      console.error('Erro ao buscar produtos:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const createProduct = async (productData) => {
    try {
      const { data, error: insertError } = await supabase
        .from('products')
        .insert([{ ...productData, active: true }])
        .select()

      if (insertError) throw insertError
      setProducts((current) => [...current, data[0]].sort((a, b) => a.name.localeCompare(b.name)))
      return { success: true, data: data[0] }
    } catch (err) {
      console.error('Erro ao criar produto:', err)
      return { success: false, error: err.message }
    }
  }

  const updateProduct = async (id, productData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()

      if (updateError) throw updateError
      setProducts((current) => current.map((product) => product.id === id ? data[0] : product))
      return { success: true, data: data[0] }
    } catch (err) {
      console.error('Erro ao atualizar produto:', err)
      return { success: false, error: err.message }
    }
  }

  const deleteProduct = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('products')
        .update({ active: false })
        .eq('id', id)

      if (deleteError) throw deleteError
      setProducts((current) => current.filter((product) => product.id !== id))
      return { success: true }
    } catch (err) {
      console.error('Erro ao remover produto:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    products,
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refreshProducts: fetchProducts
  }
}
