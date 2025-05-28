// src/store/Actions.js
export const ADD_TO_CART = 'ADD_TO_CART';
export const REMOVE_FROM_CART = 'REMOVE_FROM_CART';
export const UPDATE_QUANTITY = 'UPDATE_QUANTITY';
export const CLEAR_CART = 'CLEAR_CART';

export const addToCart = (product) => ({
    type: ADD_TO_CART,
    payload: product,
});

// Updated removeFromCart to support removing by id and size
export const removeFromCart = (productId, size = null) => {
    const payload = size ? { id: productId, size } : { id: productId };
    console.log('removeFromCart action created with payload:', payload);
    
    return {
        type: REMOVE_FROM_CART,
        payload: payload,
    };
};

// Updated updateQuantity to support currentSize parameter
export const updateQuantity = (productId, quantity, size, color, currentSize = null) => ({
    type: UPDATE_QUANTITY,
    payload: { productId, quantity, size, color, currentSize },
});

export const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) ?? [];
    return {
        type: 'cart/load',
        payload: cart
    };
};

export const clearCartLocalStorage = () => {
    localStorage.removeItem('cart');
};

export const clearCart = () => ({
    type: CLEAR_CART,
});