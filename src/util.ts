import {getBucket} from "@extend-chrome/storage";

export interface UserSettings {
  data: {
    name: string;
    color: string;
    faceDescriptor: { [fileName: string]: string };
  }[]
}

export function getUserSettings() {
  // TODO remove this
  getBucket<UserSettings>("user_settings", "sync").clear();
  getBucket<UserSettings>("1", "sync").clear();
  getBucket<UserSettings>("2", "sync").clear();
  getBucket<UserSettings>("3", "sync").clear();
  getBucket<UserSettings>("4", "sync").clear();

  return getBucket<UserSettings>("5", "sync");
}