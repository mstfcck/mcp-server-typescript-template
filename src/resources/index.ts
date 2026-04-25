import {
  createStaticResourceRegistration,
  createTemplateResourceRegistration
} from "../server/registrationHelpers.js";
import {
  generatedStaticResources,
  generatedTemplateResources
} from "./generated.js";
import {
  staticResources as builtInStaticResources,
  templateResources as builtInTemplateResources
} from "./static.js";

export const staticResources = [
  ...builtInStaticResources,
  ...generatedStaticResources
].map(createStaticResourceRegistration);

export const templateResources = [
  ...builtInTemplateResources,
  ...generatedTemplateResources
].map(createTemplateResourceRegistration);
