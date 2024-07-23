import {getBucket} from "@extend-chrome/storage";

export interface UserSettings {
  data: PersonData[]
}

export interface PersonData {
  name: string;
  color: colors
  faceDescriptor: { [fileName: string]: string };
}

export interface FaceImageSource {
  [fileName: string]: string
}

export type colors = "red" | "blue" | "green" | "purple" | "orange" | "black"

export const selectableColors = ["red", "blue", "green", "purple", "orange", "black"];

export function getUserSettingBucket() {
  return getBucket<UserSettings>("us1", "sync");
}

export function getFaceImageBucket() {
  return getBucket<FaceImageSource>("im1", "local");
}
