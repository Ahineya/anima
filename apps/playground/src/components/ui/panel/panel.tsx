import {CSSProperties, FC, HTMLProps} from "react";
import classNames from "classnames";
import "./panel.scss";

type IProps = {
  gap?: number;
  direction?: 'row' | 'column';
} & HTMLProps<HTMLDivElement>;

export const Panel: FC<IProps> = ({
                                    className,
                                    children,
                                    gap,
                                    direction,
                                    style,
                                    ...rest
                                  }) => {

  return (
    <div
      className={classNames('panel', className)}
      style={{
        '--gap': gap ? `${gap}px` : undefined,
        '--direction': direction,
        ...style
      } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
}
