import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState } from "../index";
import { store } from "../index";
type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
