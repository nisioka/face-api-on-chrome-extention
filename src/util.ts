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
  getBucket<UserSettings>("us1", "sync").clear();
  return getBucket<UserSettings>("us2", "sync");
}

export function getFaceImageBucket() {
  getBucket<UserSettings>("im1", "local").clear();
  return getBucket<FaceImageSource>("im2", "local");
}
