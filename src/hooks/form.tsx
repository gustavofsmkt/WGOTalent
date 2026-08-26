import { lazy } from "react";
import { createFormHook } from "@tanstack/react-form";

import { createFormHookContexts } from "@tanstack/react-form";

const inputField = lazy(() => import("../components/forms/inputField"));
const selectField = lazy(() => import("../components/forms/selectField"));
const checkboxField = lazy(() => import("../components/forms/checkboxField"));
const switchField = lazy(() => import("../components/forms/switchField"));
const textAreaField = lazy(() => import("../components/forms/textAreaField"));

const resetButton = lazy(() => import("../components/forms/resetButton"));
const saveButton = lazy(() => import("../components/forms/saveButton"));

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    InputField: inputField,
    SelectField: selectField,
    CheckboxField: checkboxField,
    SwitchField: switchField,
    TextAreaField: textAreaField,
  },
  formComponents: {
    SaveButton: saveButton,
    ResetButton: resetButton,
  },
  fieldContext,
  formContext,
});
