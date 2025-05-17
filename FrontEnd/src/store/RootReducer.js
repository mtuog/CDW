import { combineReducers } from 'redux';
import cartReducer from './CartReducer';

const rootReducer = combineReducers({
    cart: cartReducer,
    // Add other reducers here if you have them
});

export default rootReducer;
