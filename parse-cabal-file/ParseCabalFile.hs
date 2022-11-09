{-# LANGUAGE ImportQualifiedPost #-}
{-# LANGUAGE LambdaCase #-}

import Data.ByteString qualified as BS
import Data.List (intercalate)
import Distribution.Package (packageVersion)
import Distribution.PackageDescription.Parsec (parseGenericPackageDescriptionMaybe)
import Distribution.Verbosity qualified as Verbosity
import Distribution.Version (versionNumbers)
import System.Environment (getArgs)
import System.IO (hPutStrLn, stderr, stdout)

main :: IO ()
main = do
  cabalFile <-
    getArgs >>= \case
      [cabalFile] -> return cabalFile
      _ -> errorWithoutStackTrace "Expected exactly one argument: CABAL_FILE"

  cabalFileContents <- BS.readFile cabalFile
  packageDesc <-
    maybe (errorWithoutStackTrace "Could not parse cabal file") return $
      parseGenericPackageDescriptionMaybe cabalFileContents

  output
    [ ("version", intercalate "." . map show . versionNumbers . packageVersion $ packageDesc)
    ]

output :: [(String, String)] -> IO ()
output = mapM_ (uncurry output')
  where
    output' key value = do
      let kv = key ++ "=" ++ value
      -- log to stderr
      hPutStrLn stderr $ "Setting: " ++ kv
      -- output to stdout into $GITHUB_OUTPUT
      hPutStrLn stdout kv
