# bitmap-data-helpers
Convert single or bundled files between strings, buffers, files and dataURLs.

Currently only supports png images and zip bundles, nor can it identify errors.

## API 
#### charcode conversion
bin2str (*string* binaryString, *number* byteLength) : *string* textString (UTF16 encoding default)

str2bin (*string* textString) : *string* binaryString
#### buffer conversion
str2buf (*string* string, *boolean* decodingNeeded) : *NodeBuffer* buffer

buf2str (*NodeBuffer* buffer, *string* nodeEncodingKey) : *string* string

#### dataURL conversion
makeOne (*NodeBuffer* rawBuffer) : *string* dataURL

makeOneAsync (*NodeBuffer* rawBuffer) : *object* promise

unmakeOne (*string* dataURL, *string* nodeEncodingKey) : *NodeBuffer* buffer

mimeTypeOf (*string* dataURL) : *string* mimeType

addPrefixTo (*string* mimeType, *string* b64Body) : *string* dataURL

removePrefixFrom (*string* dataURL ) : *string* b64Body

#### zip
extractOne ( *object* jszipEntry, [*function* onProgress]) : *object* promise
##### batch zip operations
zip2url ( *NodeBuffer* b64ZippedBuffer ) : *object* dataURLCollection

zip2buf ( *NodeBuffer* b64ZippedBuffer  ) : *object* bufferCollection

zip2list ( *NodeBuffer* b64ZippedBuffer ) : *object* zipEntryCollection

#### b64
encode ( *string* binaryString ) : *string* b64String

decode ( *string* b64String ) : *string* binaryString
