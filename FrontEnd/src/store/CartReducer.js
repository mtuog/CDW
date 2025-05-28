// src/store/cartReducer.js
import { ADD_TO_CART, REMOVE_FROM_CART, UPDATE_QUANTITY, CLEAR_CART } from './Actions';

// Hàm lưu giỏ hàng vào localStorage
const saveCartToLocalStorage = (cart) => {
    localStorage.setItem('cart', JSON.stringify(cart));
};

const initialState = JSON.parse(localStorage.getItem('cart')) || [];

const cartReducer = (state = initialState, action) => {
    let updatedCart;
    switch (action.type) {
        case ADD_TO_CART:
            // Check if product with same ID and size already exists
            const existingItemIndex = state.findIndex(item => 
                item.id === action.payload.id && 
                item.size === action.payload.size
            );
            
            if (existingItemIndex !== -1) {
                // Update existing item quantity
                updatedCart = state.map((item, index) => 
                    index === existingItemIndex
                        ? { ...item, quantity: item.quantity + action.payload.quantity }
                        : item
                );
            } else {
                // Add new item
                updatedCart = [...state, { 
                    id: action.payload.id, 
                    quantity: action.payload.quantity,
                    size: action.payload.size
                }];
            }
            saveCartToLocalStorage(updatedCart);
            return updatedCart;
            
        case REMOVE_FROM_CART:
            console.log('CartReducer REMOVE_FROM_CART:', action.payload);
            console.log('Current cart state:', state);
            
            // Remove specific item by id and size (if provided)
            if (action.payload.size) {
                console.log('Removing by id and size:', action.payload.id, action.payload.size);
                updatedCart = state.filter(item => {
                    const itemMatch = (String(item.id) === String(action.payload.id) && item.size === action.payload.size);
                    console.log(`Checking item ${item.id}-${item.size} vs ${action.payload.id}-${action.payload.size}: match=${itemMatch}`);
                    return !itemMatch;
                });
            } else {
                console.log('Removing by id only:', action.payload.id);
                // If no size specified, remove by id only (for backward compatibility)  
                updatedCart = state.filter(item => String(item.id) !== String(action.payload.id));
            }
            
            console.log('Updated cart after removal:', updatedCart);
            saveCartToLocalStorage(updatedCart);
            return updatedCart;
            
        case UPDATE_QUANTITY:
            const { productId, quantity, size, color, currentSize } = action.payload;
            
            // Trường hợp chỉ cập nhật số lượng (không thay đổi size)
            if (!size || size === currentSize) {
                updatedCart = state.map(item => {
                    if (currentSize) {
                        // Có size cụ thể - tìm theo id và size
                        return (item.id === productId && item.size === currentSize)
                            ? { ...item, quantity }
                            : item;
                    } else {
                        // Không có size - tìm theo id
                        return item.id === productId
                            ? { ...item, quantity }
                            : item;
                    }
                });
            } 
            // Trường hợp thay đổi size
            else {
                // Tìm item hiện tại và item đích (nếu có)
                const currentItemIndex = state.findIndex(item => 
                    item.id === productId && item.size === currentSize
                );
                const targetItemIndex = state.findIndex(item => 
                    item.id === productId && item.size === size
                );
                
                if (currentItemIndex === -1) {
                    // Không tìm thấy item hiện tại
                    return state;
                }
                
                if (targetItemIndex !== -1 && targetItemIndex !== currentItemIndex) {
                    // Đã có item với size mới - gộp quantity và xóa item cũ
                    updatedCart = state.map((item, index) => {
                        if (index === targetItemIndex) {
                            return { ...item, quantity: item.quantity + quantity };
                        } else if (index === currentItemIndex) {
                            return null; // Đánh dấu để xóa
                        } else {
                            return item;
                        }
                    }).filter(item => item !== null);
                } else {
                    // Chưa có item với size mới - cập nhật size của item hiện tại
                    updatedCart = state.map((item, index) => 
                        index === currentItemIndex
                            ? { ...item, quantity, size }
                            : item
                    );
                }
            }
            saveCartToLocalStorage(updatedCart);
            return updatedCart;
            
        case CLEAR_CART:
            saveCartToLocalStorage([]);
            return [];
            
        case 'cart/load':
            updatedCart = action.payload;
            saveCartToLocalStorage(updatedCart);
            return updatedCart;
            
        default:
            // Đảm bảo lưu trạng thái ban đầu vào localStorage
            if (state !== initialState) {
                saveCartToLocalStorage(state);
            }
            return state;
    }
};

export default cartReducer;
