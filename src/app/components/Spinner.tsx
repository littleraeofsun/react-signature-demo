"use client";

export const Spinner = (props: { message?: string }) => {
  props.message ??= 'Loading...';
  return (
    <div className="spinner-border" role="status">
      <span className="visually-hidden">{props.message}</span>
    </div>
  );
};
