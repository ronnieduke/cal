import { APP_NAME, LOGO_INVERT_IN_DARK } from "@calcom/lib/constants";
import classNames from "@calcom/ui/classNames";

export function Logo({
  small,
  icon,
  inline = true,
  className,
  src = "/api/logo",
}: {
  small?: boolean;
  icon?: boolean;
  inline?: boolean;
  className?: string;
  src?: string;
}) {
  return (
    <h3 className={classNames("logo", inline && "inline", className)}>
      <strong>
        {icon ? (
          <img
            className={classNames("mx-auto w-9", LOGO_INVERT_IN_DARK && "dark:invert")}
            alt={APP_NAME}
            title={APP_NAME}
            src={`${src}?type=icon`}
          />
        ) : (
          <img
            className={classNames(small ? "h-4 w-auto" : "h-5 w-auto", LOGO_INVERT_IN_DARK && "dark:invert")}
            alt={APP_NAME}
            title={APP_NAME}
            src={src}
          />
        )}
      </strong>
    </h3>
  );
}
