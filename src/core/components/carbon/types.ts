import { Control, FieldValues } from "react-hook-form";

export interface Controlled<T> {
  controllerName: string;
  name: string;
  control: Control<FieldValues, T>;
}
