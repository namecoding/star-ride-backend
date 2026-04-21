// utils/mongooseSanitize.js

export const sanitizePlugin = (schema, options) => {
    const hiddenFields = options?.hidden || [];
  
    const transform = (doc, ret) => {
      hiddenFields.forEach((field) => delete ret[field]);
      return ret;
    };
  
    schema.set("toJSON", { transform });
    schema.set("toObject", { transform });
  };