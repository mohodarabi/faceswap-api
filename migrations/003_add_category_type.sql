-- Add type column to categories for tab filtering (image, video, motion_control)
ALTER TABLE public.categories
  ADD COLUMN type text NOT NULL DEFAULT 'image'
  CHECK (type IN ('image', 'video', 'motion_control'));

CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories (type);

COMMENT ON COLUMN public.categories.type IS 'Tab type: image (merge_face), video (face_swap), motion_control.';
