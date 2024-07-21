import {getBucket} from "@extend-chrome/storage";

export interface UserSettings {
  data: personData[]
}

export interface personData {
  name: string;
  color: colors
  faceDescriptor: { [fileName: string]: string };
}

export type colors = "red" | "blue" | "green" | "purple" | "orange" | "black" | null

export const selectableColors = ["red", "blue", "green", "purple", "orange", "black"];

export function getUserSettingBucket() {
  return getBucket<UserSettings>("us1", "sync");
}