module Foo where

xs : [Int]
xs = [1, 2, 3]

someStr :: Int -> String
someStr x = do
  show
  $ ((map (x +) xs))
