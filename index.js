module.exports = function SkillPresets(mod) {

    const command = mod.command || mod.require.command
    const settings = mod.settings

    if (!settings.presets || settings.presets === undefined) settings.presets = []

    let activeAdvSkills,
        activeGlyphs

    mod.hook('S_RP_SKILL_POLISHING_LIST', 1, (e) => {
        activeAdvSkills = e.optionEffects
    })

    mod.hook('S_CREST_INFO', 2, (e) => {
        activeGlyphs = e.crests
    })

    function savePreset(name) {
        if (!name || name === undefined) {
            command.message(`You must type a name for the preset.`)
            return
        }
        if (!activeAdvSkills || !activeGlyphs) {
            command.message(`Problem saving preset. Open glyph window and set glyphs and advanced skills first.`)
            return
        }

        const glyphs = activeGlyphs.filter((e) => e.enable).map((e) => e.id)
        const advSkills = activeAdvSkills.filter((e) => e.active).map((e) => ({ group:e.group, id: e.id }) )
        const preset = settings.presets.find((e) => e.name == name)
        if (preset) {
            preset.glyphs = glyphs
            preset.advSkills = advSkills
        } else {
            settings.presets.push({
                name: name,
                glyphs: glyphs,
                advSkills: advSkills,
            })
        }

        command.message(`Preset ${name} saved.`)
    }

    function applyPreset(name) {
        const preset = settings.presets.find((e) => e.name == name)

        if (!preset || preset === undefined) {
            command.message(`Preset ${name} not found.` )
            return
        }

        mod.send('C_CREST_APPLY_LIST', 2, {
            glyphs: preset.glyphs
        })

        let delay = 250
        preset.advSkills.forEach((e) => {
            mod.setTimeout(() => {
                mod.send('C_RQ_SKILL_POLISHING_CHANGE_OPTION', 1, {
                    group: e.group,
                    id: e.id,
                    active: true,
                })
            }, delay += 250);
        })

        command.message(`Preset ${name} applied.` )
    }

    function removePreset(name) {
        const preset = settings.presets.findIndex((e) => e.name == name)

        if (!preset || preset === undefined) {
            command.message(`Preset ${name} not found.`)
            return
        }

        settings.presets.splice(preset, 1)
    }

    command.add(['presets', 'preset', 'pset'], (...values) => {
        switch (values[0]) {
            case 'add':
            case 'save':
                savePreset(values[1])
                break
            case 'remove':
            case 'rem':
            case 'delete':
            case 'del':
                removePreset(values[1])
                break
            case 'list':
                command.message(`Preset list: ${settings.presets.map((e) => e.name).join(', ')}`)
                break
            case 'apply':
            case 'set':
                applyPreset(values[1])
                break
            default:
                applyPreset(values[0])
                break
        }
    })
}