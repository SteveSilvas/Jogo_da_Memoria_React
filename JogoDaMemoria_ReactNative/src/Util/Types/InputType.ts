import { KeyboardType } from "react-native"

export type InputType = {
    type: KeyboardType,
    style?: object,
    placeholder?: string,
    onChange: (e: any) => void,
    value?: any
}