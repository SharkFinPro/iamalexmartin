import styles from "./banner.module.scss";
import EditableText from "@/components/EditableText";

type EditConfig = {
  isAdmin: boolean;
  model: string;
  id: string;
  titleField: string;
  descriptionField: string;
};

export default function Banner({
  title,
  description,
  edit
}: {
  title: string;
  description: string;
  edit?: EditConfig;
}) {
  const editable = !!edit?.isAdmin;

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h1>
          {editable ? (
            <EditableText model={edit!.model} id={edit!.id} field={edit!.titleField} value={title} editable>
              {title}
            </EditableText>
          ) : title}
        </h1>
        <p>
          {editable ? (
            <EditableText model={edit!.model} id={edit!.id} field={edit!.descriptionField} value={description} editable multiline>
              {description}
            </EditableText>
          ) : description}
        </p>
      </div>
    </div>
  );
}
