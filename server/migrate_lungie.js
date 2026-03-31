import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'
import * as XLSX from 'xlsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

async function importData(fileName, variant) {
  const filePath = path.join(__dirname, fileName)
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Arquivo ${fileName} não encontrado. Pulando...`)
    return 0
  }

  console.log(`📂 Processando ${fileName} (${variant})...`)
  
  let rows = []
  
  if (fileName.endsWith('.xlsx')) {
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 })
  } else {
    const content = fs.readFileSync(filePath, 'latin1')
    const lines = content.split(/\r?\n/)
    rows = lines.map(line => line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/))
  }

  let importedCount = 0
  let isDataStarted = false

  for (let i = 0; i < rows.length; i++) {
    const columns = rows[i]
    if (!columns || columns.length < 2) continue

    const firstCol = String(columns[0] || '').trim()
    
    // Detecção dinâmica de início de dados:
    if (firstCol.includes('Dicionário') || firstCol.includes('Fonte:') || firstCol.includes('Palavra Santome')) {
      isDataStarted = true
      if (firstCol.includes('Palavra Santome')) continue 
      if (firstCol.includes('Fonte:')) continue
      if (firstCol.includes('Dicionário')) continue
    }

    // Se tiver poucas colunas e não tivermos visto metadados, assume que é o formato de frases
    const isPhraseFormat = columns.length <= 4

    let word, phonetic, category, translationPt, source;

    if (isPhraseFormat) {
      word = String(columns[0] || '').replace(/"/g, '').trim()
      translationPt = String(columns[1] || '').replace(/"/g, '').trim()
      category = String(columns[2] || '').replace(/"/g, '').trim() || 'Exemplo gramatical'
      source = 'Lung\'Ie Examples'
    } else {
      word = String(columns[0] || '').replace(/"/g, '').trim()
      phonetic = String(columns[1] || '').replace(/"/g, '').trim()
      category = String(columns[2] || '').replace(/"/g, '').trim()
      translationPt = String(columns[4] || '').replace(/"/g, '').trim()
      source = String(columns[7] || '').replace(/"/g, '').trim() || 'Dicionário 2013'
    }

    if (!word || !translationPt || word.length < 2) continue

    try {
      const existing = await prisma.dictionary.findFirst({
        where: { 
          word, 
          variant,
          translationPt: isPhraseFormat ? translationPt : undefined 
        }
      })

      if (existing) {
        await prisma.dictionary.update({
          where: { id: existing.id },
          data: {
            translationPt,
            category: category || existing.category,
            phonetic: phonetic || existing.phonetic,
            source
          }
        })
      } else {
        await prisma.dictionary.create({
          data: {
            word,
            translationPt,
            category,
            variant,
            phonetic,
            source,
            status: 'published'
          }
        })
      }
      importedCount++
      if (importedCount % 500 === 0) console.log(`📖 [${variant}] Processados ${importedCount} registros...`)
    } catch (err) {
      // Ignorar erros de constraint
    }
  }

  return importedCount
}

async function migrate() {
  console.log('🚀 Iniciando Migração Unificada (CSV/XLSX)...')

  try {
    const lungieGrammarCount = await importData('lung\'ie.csv.csv', 'Lung\'Ie')
    const lungieDictCount = await importData('lungie_dicionario.csv.csv', 'Lung\'Ie')
    const forroCount = await importData('forro.csv.csv', 'Forro')

    console.log('\n--- Resumo Final ---')
    console.log(`✅ Lung'Ie (Exemplos): ${lungieGrammarCount} registros`)
    console.log(`✅ Lung'Ie (Dicionário): ${lungieDictCount} registros`)
    console.log(`✅ Forro: ${forroCount} registros`)
    console.log(`📊 Total: ${lungieGrammarCount + lungieDictCount + forroCount} registros migrados/atualizados.`)

  } catch (err) {
    console.error('❌ Erro fatal na migração:', err)
  } finally {
    await prisma.$disconnect()
  }
}

migrate()
