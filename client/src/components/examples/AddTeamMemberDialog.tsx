import AddTeamMemberDialog from "../AddTeamMemberDialog";

export default function AddTeamMemberDialogExample() {
  return (
    <AddTeamMemberDialog
      onAdd={(member) => console.log("New member added:", member)}
    />
  );
}
