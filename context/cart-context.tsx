"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"

export interface CartItem {
  id: number
  title: string
  price: string
  image: string
  seller: string
  quantity: number
  pickupPoints: number
}

interface CartState {
  items: CartItem[]
  totalItems: number
  totalPrice: number
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; payload: number }
  | { type: "UPDATE_QUANTITY"; payload: { id: number; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] }

// const CartContext = createContext<{
//   state: CartState
//   dispatch: React.Dispatch<CartAction>
// } | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find((item) => item.id === action.payload.id)

      if (existingItem) {
        const updatedItems = state.items.map((item) =>
          item.id === action.payload.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
        return calculateTotals({ ...state, items: updatedItems })
      }

      const newItem = { ...action.payload, quantity: 1 }
      return calculateTotals({ ...state, items: [...state.items, newItem] })
    }

    case "REMOVE_ITEM": {
      const updatedItems = state.items.filter((item) => item.id !== action.payload)
      return calculateTotals({ ...state, items: updatedItems })
    }

    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return cartReducer(state, { type: "REMOVE_ITEM", payload: action.payload.id })
      }

      const updatedItems = state.items.map((item) =>
        item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item,
      )
      return calculateTotals({ ...state, items: updatedItems })
    }

    case "CLEAR_CART":
      return { items: [], totalItems: 0, totalPrice: 0 }

    case "LOAD_CART":
      return calculateTotals({ ...state, items: action.payload })

    default:
      return state
  }
}

function calculateTotals(state: CartState): CartState {
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = state.items.reduce((sum, item) => {
    const price = Number.parseFloat(item.price.replace(/[₦,]/g, ""))
    return sum + price * item.quantity
  }, 0)

  return { ...state, totalItems, totalPrice }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    totalItems: 0,
    totalPrice: 0,
  })

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("pickupfirst-cart")
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart)
        dispatch({ type: "LOAD_CART", payload: cartItems })
      } catch (error) {
        console.error("Failed to load cart from localStorage:", error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("pickupfirst-cart", JSON.stringify(state.items))
  }, [state.items])

  // return <CartContext.Provider value={{ state, dispatch }}>{children}</CartContext.Provider>
}

export function useCart() {
  // const context = useContext(CartContext)
  // if (!context) {
  //   throw new Error("useCart must be used within a CartProvider")
  //   console.log("use cart")
  // }
  // return context
}
