import { useAppSelector } from "@/redux/typed-hooks";
import { Field, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { useDispatch } from "react-redux";
import { setNewSimName } from "@/redux/slices/sims-slice";

export function SimsNewName() {
  const newSimName = useAppSelector((state) => state.sims.newSimName);
  const dispatch = useDispatch();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    dispatch(setNewSimName(input));
  };
  return (
    <Field className="mt-4 max-w-5/12">
      <FieldLabel htmlFor="new-sim-name">Name</FieldLabel>
      <Input
        id="new-sim-name"
        type="text"
        placeholder="add a name"
        value={newSimName || ""}
        onChange={handleNameChange}
      />
    </Field>
  );
}
