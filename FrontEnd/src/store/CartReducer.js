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
            updatedCart = state.filter(item => item.id !== action.payload);
            saveCartToLocalStorage(updatedCart);
            return updatedCart;
        case UPDATE_QUANTITY:
            const { productId, quantity, size, color } = action.payload;
            
            // Nếu chỉ cập nhật số lượng (không cập nhật size)
            if (!size) {
                updatedCart = state.map(item =>
                    item.id === productId
                        ? { ...item, quantity }
                        : item
                );
            } 
            // Trường hợp cập nhật cả size
            else {
                // Kiểm tra xem đã có sản phẩm với size mới chưa
                const existingSizeIndex = state.findIndex(item => 
                    item.id === productId && item.size === size
                );
                
                if (existingSizeIndex !== -1 && existingSizeIndex !== state.findIndex(item => item.id === productId)) {
                    // Có sản phẩm với size mới, tăng số lượng sản phẩm đó và xóa sản phẩm cũ
                    updatedCart = state.map((item, index) => {
                        if (index === existingSizeIndex) {
                            return { ...item, quantity: item.quantity + quantity };
                        } else if (item.id === productId) {
                            return null; // Đánh dấu để xóa
                        } else {
                            return item;
                        }
                    }).filter(item => item !== null);
                } else {
                    // Chỉ cập nhật size của sản phẩm hiện tại
                    updatedCart = state.map(item =>
                        item.id === productId
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
