import { combineReducers } from 'redux';

// Заглушка, пустой редьюсер
const dummyReducer = (state = {}, action) => {
  return state;
};

const rootReducer = combineReducers({
  dummy: dummyReducer,
  // добавляй другие редьюсеры сюда
});

export default rootReducer;
